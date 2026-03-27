const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } = require('mercadopago');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

dotenv.config();


const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preApproval = new PreApproval(mpClient);
const preApprovalPlan = new PreApprovalPlan(mpClient);
const mpPayment = new Payment(mpClient);

const planConfig = {
  monthly: { amount: 100, description: 'Plano Mensal SORED' },
  annual: { amount: 1100, description: 'Plano Anual SORED' },
};

// Utilitário para criar plano no Mercado Pago
async function createMPPlan({ planType, price, frequency, frequencyType }) {
  const body = {
    reason: `Plano ${planType === 'monthly' ? 'Mensal' : 'Anual'} SaaS`,
    auto_recurring: {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: price,
      currency_id: 'BRL',
    },
    payment_methods_allowed: { payment_types: [{ id: 'credit_card' }] },
  };
  const result = await preApprovalPlan.create({ body });
  return result.id;
}

// POST /plans: Cria planos mensal e anual
router.post('/plans', async (req, res) => {
  try {
    // Cria plano mensal
    let monthlyPlan = await Plan.findOne({ planType: 'monthly' });
    if (!monthlyPlan) {
      const mpPlanId = await createMPPlan({ planType: 'monthly', price: 100, frequency: 1, frequencyType: 'months' });
      monthlyPlan = await Plan.create({ planType: 'monthly', mpPlanId, price: 100, frequency: 1, frequencyType: 'months' });
    }
    // Cria plano anual
    let annualPlan = await Plan.findOne({ planType: 'annual' });
    if (!annualPlan) {
      const mpPlanId = await createMPPlan({ planType: 'annual', price: 1100, frequency: 1, frequencyType: 'years' });
      annualPlan = await Plan.create({ planType: 'annual', mpPlanId, price: 1100, frequency: 1, frequencyType: 'years' });
    }
    res.status(201).json({ monthlyPlan, annualPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /pix: Cria pagamento PIX para um plano
router.post('/pix', async (req, res) => {
  try {
    const { email, planType } = req.body;
    if (!email || !planType) {
      return res.status(400).json({ error: 'email e planType são obrigatórios' });
    }
    if (!planConfig[planType]) {
      return res.status(400).json({ error: 'planType inválido' });
    }

    const { amount, description } = planConfig[planType];
    const idempotencyKey = uuidv4();

    const body = {
      transaction_amount: amount,
      description,
      payment_method_id: 'pix',
      payer: { email },
    };

    const result = await mpPayment.create({ body, requestOptions: { idempotencyKey } });
    const qrCode = result?.point_of_interaction?.transaction_data?.qr_code || null;
    const qrCodeBase64 = result?.point_of_interaction?.transaction_data?.qr_code_base64 || null;

    db.prepare(`INSERT INTO payments (id, plan_type, status, amount, currency, mp_payment_id, payer_email, idempotency_key, raw_payload, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run(
      uuidv4(),
      planType,
      result?.status || 'pending',
      amount,
      result?.currency_id || 'BRL',
      result?.id || null,
      email,
      idempotencyKey,
      JSON.stringify({ qrCode, qrCodeBase64, mp: result })
    );

    return res.status(201).json({
      paymentId: result?.id,
      status: result?.status,
      qrCode,
      qrCodeBase64,
      expiresAt: result?.date_of_expiration || null,
    });
  } catch (error) {
    console.error('PIX payment error:', error);
    return res.status(500).json({ error: 'Erro ao criar pagamento PIX' });
  }
});

// GET /pix/status/:paymentId: Consulta status do pagamento PIX
router.get('/pix/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) return res.status(400).json({ error: 'paymentId é obrigatório' });

    const result = await mpPayment.get({ id: paymentId });
    if (result?.status) {
      db.prepare('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE mp_payment_id = ?')
        .run(result.status, paymentId);
    }
    return res.json({
      paymentId,
      status: result?.status || 'unknown',
      detail: result?.status_detail || null,
    });
  } catch (error) {
    console.error('PIX status error:', error);
    return res.status(500).json({ error: 'Erro ao consultar pagamento PIX' });
  }
});

// POST /subscriptions: Cria assinatura para usuário
router.post('/subscriptions', async (req, res) => {
  try {
    const { email, token, planType } = req.body;
    if (!email || !token || !planType) return res.status(400).json({ error: 'email, token e planType são obrigatórios' });
    const plan = await Plan.findOne({ planType });
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email });
    const baseFrontendUrl = process.env.FRONTEND_URL_PRODUCTION || process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = process.env.MP_SUCCESS_URL || `${baseFrontendUrl}/sucesso`;

    // Cria assinatura no Mercado Pago
    const body = {
      preapproval_plan_id: plan.mpPlanId,
      payer_email: email,
      card_token_id: token,
      back_url: successUrl,
      status: 'authorized',
    };
    const result = await preApproval.create({ body });
    // Salva assinatura no banco
    const subscription = await Subscription.create({
      userId: user._id,
      mpSubscriptionId: result.id,
      status: result.status,
      planType,
      nextBilling: result.auto_recurring?.next_payment_date,
    });
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /subscriptions/:id: Consulta status da assinatura
router.get('/subscriptions/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate('userId');
    if (!subscription) return res.status(404).json({ error: 'Assinatura não encontrada' });
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /webhooks: Recebe notificações do Mercado Pago
router.post('/webhooks', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type !== 'preapproval') return res.status(200).send('ignorado');
    const mpSubscriptionId = data && data.id;
    if (!mpSubscriptionId) return res.status(400).send('id ausente');
    const subscription = await Subscription.findOne({ mpSubscriptionId });
    if (!subscription) return res.status(404).send('assinatura não encontrada');
    // Busca status atualizado no Mercado Pago
    const mpResult = await preApproval.findById({ id: mpSubscriptionId });
    const newStatus = mpResult.status;
    // Idempotência: só atualiza se mudou
    if (subscription.status !== newStatus) {
      subscription.status = newStatus;
      subscription.nextBilling = mpResult.auto_recurring?.next_payment_date;
      // Grace period: 3 dias se pending/failure
      if (["pending", "failure"].includes(newStatus)) {
        const grace = new Date();
        grace.setDate(grace.getDate() + 3);
        subscription.gracePeriodUntil = grace;
      } else {
        subscription.gracePeriodUntil = null;
      }
      subscription.updatedAt = new Date();
      await subscription.save();
    }
    res.status(200).send('ok');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
