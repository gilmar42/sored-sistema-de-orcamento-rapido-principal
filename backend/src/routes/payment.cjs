const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } = require('mercadopago');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const dotenv = require('dotenv');

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
  // Mercado Pago v2 (PreApproval) requires an HTTPS back_url.
  // We'll try to use the configured URL, but force HTTPS if possible, or use a valid placeholder.
  let successUrl = process.env.MP_SUCCESS_URL || '';
  
  if (!successUrl || successUrl.includes('localhost')) {
    // Falls back to a valid HTTPS URL if localhost is detected, as MP often rejects it for Plans.
    const baseFrontendUrl = process.env.FRONTEND_URL_PRODUCTION || 'https://projeto-sored.vercel.app';
    successUrl = `${baseFrontendUrl}/sucesso`;
  }

  const body = {
    reason: `Plano ${planType === 'monthly' ? 'Mensal' : 'Anual'} SaaS`,
    auto_recurring: {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: price,
      currency_id: 'BRL',
    },
    back_url: successUrl,
    payment_methods_allowed: { payment_types: [{ id: 'credit_card' }] },
  };
  
  try {
    const result = await preApprovalPlan.create({ body });
    return result.id;
  } catch (err) {
    console.error(`❌ MP Plan Creation Failed (${planType}):`, err.message);
    if (err.response) console.error('MP Details:', JSON.stringify(err.response, null, 2));
    throw err;
  }
}

// FORMAT DATETIME
function formatDT(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 19).replace('T', ' ');
}

// POST /plans: Cria planos mensal e anual
router.post('/plans', async (req, res) => {
  try {
    // Cria plano mensal
    let [rows] = await db.query('SELECT * FROM plans WHERE planType = ? LIMIT 1', ['monthly']);
    let monthlyPlan = rows[0];
    if (!monthlyPlan) {
      const mpPlanId = await createMPPlan({ planType: 'monthly', price: 100, frequency: 1, frequencyType: 'months' });
      await db.query(
        'INSERT INTO plans (planType, mpPlanId, price, frequency, frequencyType) VALUES (?, ?, ?, ?, ?)',
        ['monthly', mpPlanId, 100, 1, 'months']
      );
      const [mRows] = await db.query('SELECT * FROM plans WHERE planType = ? LIMIT 1', ['monthly']);
      monthlyPlan = mRows[0];
    }
    // Cria plano anual
    let [aRows] = await db.query('SELECT * FROM plans WHERE planType = ? LIMIT 1', ['annual']);
    let annualPlan = aRows[0];
    if (!annualPlan) {
      const mpPlanId = await createMPPlan({ 
        planType: 'annual', 
        price: 1100, 
        frequency: 12, 
        frequencyType: 'months' 
      });
      await db.query(
        'INSERT INTO plans (planType, mpPlanId, price, frequency, frequencyType) VALUES (?, ?, ?, ?, ?)',
        ['annual', mpPlanId, 1100, 12, 'months']
      );
      const [aNewRows] = await db.query('SELECT * FROM plans WHERE planType = ? LIMIT 1', ['annual']);
      annualPlan = aNewRows[0];
    }
    res.status(201).json({ monthlyPlan, annualPlan });
  } catch (error) {
    const fs = require('fs');
    const logMsg = `\n[${new Date().toISOString()}] Plans Error: ${error.message}\n` + 
                   (error.response ? JSON.stringify(error.response, null, 2) : error.stack) + '\n';
    fs.appendFileSync('mp_errors.log', logMsg);
    console.error('❌ [Plans Error]:', error.message);
    if (error.response) console.error('MP Data Error:', JSON.stringify(error.response, null, 2));
    res.status(500).json({ error: 'Erro ao inicializar planos no Mercado Pago', details: error.message });
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

    await db.query(`INSERT INTO payments (id, plan_type, status, amount, currency, mp_payment_id, payer_email, idempotency_key, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      uuidv4(),
      planType,
      result?.status || 'pending',
      amount,
      result?.currency_id || 'BRL',
      result?.id || null,
      email,
      idempotencyKey,
      JSON.stringify({ qrCode, qrCodeBase64, mp: result })
    ]);

    return res.status(201).json({
      paymentId: result?.id,
      status: result?.status,
      qrCode,
      qrCodeBase64,
      expiresAt: result?.date_of_expiration || null,
    });
  } catch (error) {
    console.error('❌ [PIX Error]:', error.message);
    if (error.response) console.error('MP Data Error:', JSON.stringify(error.response, null, 2));
    return res.status(500).json({ error: 'Erro ao criar pagamento PIX', details: error.message });
  }
});

// GET /pix/status/:paymentId: Consulta status do pagamento PIX
router.get('/pix/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) return res.status(400).json({ error: 'paymentId é obrigatório' });

    const result = await mpPayment.get({ id: paymentId });
    if (result?.status) {
      await db.query('UPDATE payments SET status = ? WHERE mp_payment_id = ?', [result.status, paymentId]);
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
    
    const [pRows] = await db.query('SELECT * FROM plans WHERE planType = ? LIMIT 1', [planType]);
    const plan = pRows[0];
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });

    let [uRows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    let user = uRows[0];
    if (!user) {
      // Create user if not created
      const bcrypt = require('bcryptjs');
      const userId = `U-${Date.now()}`;
      const tenantId = `T-${Date.now()}`;
      await db.query('INSERT INTO tenants (id, company_name) VALUES (?, ?)', [tenantId, 'Empresa Padrão']);
      const pwHash = await bcrypt.hash(uuidv4(), 10);
      await db.query('INSERT INTO users (id, email, password_hash, tenant_id) VALUES (?, ?, ?, ?)', [userId, email, pwHash, tenantId]);
      
      const [uNewRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = uNewRows[0];
    }
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
    const nextBillRaw = result.auto_recurring?.next_payment_date;
    const nextBilling = nextBillRaw ? formatDT(nextBillRaw) : null;

    const [rs] = await db.query(`INSERT INTO subscriptions (userId, mpSubscriptionId, status, planType, nextBilling)
      VALUES (?, ?, ?, ?, ?)`, [
      user.id,
      result.id,
      result.status,
      planType,
      nextBilling
    ]);

    const [sRows] = await db.query('SELECT * FROM subscriptions WHERE id = ?', [rs.insertId]);
    res.status(201).json(sRows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /subscriptions/:id: Consulta status da assinatura
router.get('/subscriptions/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT s.*, u.email as userEmail FROM subscriptions s LEFT JOIN users u ON s.userId = u.id WHERE s.id = ?', [req.params.id]);
    const subscription = rows[0];
    if (!subscription) return res.status(404).json({ error: 'Assinatura não encontrada' });
    
    // Simulate mongoose populate slightly
    subscription.userId = { id: subscription.userId, email: subscription.userEmail };
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /webhooks: Recebe notificações do Mercado Pago
router.post('/webhooks', async (req, res) => {
  try {
    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];

    let rawBody = req.body;
    let payload = {};

    if (Buffer.isBuffer(rawBody)) {
      payload = JSON.parse(rawBody.toString());
    } else {
      payload = rawBody;
    }

    console.log('[Webhook] Recebido MP Notificação:', payload.type, 'Action:', payload.action);

    if (payload.type !== 'preapproval' && payload.action !== 'payment.created' && payload.action !== 'payment.updated') {
      return res.status(200).send('ignorado');
    }

    if (payload.type === 'preapproval') {
      const mpSubscriptionId = payload.data && payload.data.id;
      if (!mpSubscriptionId) return res.status(400).send('id ausente');
      
      const [rows] = await db.query('SELECT * FROM subscriptions WHERE mpSubscriptionId = ? LIMIT 1', [mpSubscriptionId]);
      const subscription = rows[0];

      if (subscription) {
        const mpResult = await preApproval.findById({ id: mpSubscriptionId });
        const newStatus = mpResult.status;
        
        if (subscription.status !== newStatus) {
          let nextBilling = subscription.nextBilling;
          let gracePeriodUntil = subscription.gracePeriodUntil;

          if (mpResult.auto_recurring?.next_payment_date) {
            nextBilling = formatDT(mpResult.auto_recurring.next_payment_date);
          }

          if (["pending", "failure"].includes(newStatus)) {
            const grace = new Date();
            grace.setDate(grace.getDate() + 3);
            gracePeriodUntil = formatDT(grace);
          } else {
            gracePeriodUntil = null;
          }
          
          await db.query('UPDATE subscriptions SET status = ?, nextBilling = ?, gracePeriodUntil = ? WHERE id = ?', [
            newStatus,
            nextBilling,
            gracePeriodUntil,
            subscription.id
          ]);
        }
      }
    } else if (payload.action && payload.action.startsWith('payment')) {
      const paymentId = payload.data && payload.data.id;
      if (paymentId) {
        const result = await mpPayment.get({ id: paymentId });
        if (result?.status) {
          await db.query('UPDATE payments SET status = ? WHERE mp_payment_id = ?', [result.status, paymentId]);
        }
      }
    }

    res.status(200).send('ok');
  } catch (error) {
    console.error('Erro no Webhook:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
