const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } = require('mercadopago');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { setUserAccessStatus } = require('../services/accessControl.cjs');
const dotenv = require('dotenv');

dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';

// Inicialização Preguiçosa do SDK Mercado Pago
let mpConfig = null;
function getMP() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não está definido no ambiente/.env');
  
  if (!mpConfig) {
    const mpClient = new MercadoPagoConfig({ accessToken: token });
    mpConfig = {
      client: mpClient,
      preApproval: new PreApproval(mpClient),
      preApprovalPlan: new PreApprovalPlan(mpClient),
      mpPayment: new Payment(mpClient)
    };
  }
  return mpConfig;
}

const planConfig = {
  monthly: { amount: 100, description: 'Plano Mensal SORED' },
  annual: { amount: 1100, description: 'Plano Anual SORED' },
};

const TRIAL_DAYS = 5;

function getPlanDurationMs(planType) {
  return planType === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
}

// Utilitário para criar plano no Mercado Pago
async function createMPPlan({ planType, price, frequency, frequencyType }) {
  const body = buildPlanBody({ planType, price, frequency, frequencyType });

  try {
    const { preApprovalPlan } = getMP();
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

function buildPlanBody({ planType, price, frequency, frequencyType }) {
  // Mercado Pago v2 (PreApproval) requires an HTTPS back_url.
  let successUrl = process.env.MP_SUCCESS_URL || '';

  if (!successUrl || successUrl.includes('localhost')) {
    const baseFrontendUrl = process.env.FRONTEND_URL_PRODUCTION || process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:5173');
    if (!baseFrontendUrl) {
      throw new Error('FRONTEND_URL_PRODUCTION não está configurada para produção');
    }
    successUrl = `${baseFrontendUrl}/sucesso`;
  }

  return {
    reason: `Plano ${planType === 'monthly' ? 'Mensal' : 'Anual'} SaaS`,
    auto_recurring: {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: price,
      currency_id: 'BRL',
      free_trial: {
        frequency: TRIAL_DAYS,
        frequency_type: 'days',
      },
    },
    back_url: successUrl,
    payment_methods_allowed: { payment_types: [{ id: 'credit_card' }] },
  };
}

async function syncMPPlanTrial(planId, planBody) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN não está definido no ambiente/.env');
  }

  const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planBody),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao atualizar plano com trial: ${response.status} ${details}`);
  }

  return response.json();
}

function parsePixExpiration(expiresAt) {
  if (!expiresAt) return null;
  const dt = new Date(expiresAt);
  if (Number.isNaN(dt.getTime())) return null;

  const now = Date.now();
  const minMs = 30 * 60 * 1000;
  const maxMs = 30 * 24 * 60 * 60 * 1000;
  const diff = dt.getTime() - now;

  if (diff < minMs || diff > maxMs) {
    return null;
  }

  return dt.toISOString();
}

async function activatePixAccess(paymentId, paymentDetails = null) {
  const paymentKey = String(paymentId);
  const [paymentRows] = await db.query('SELECT * FROM payments WHERE mp_payment_id = ? LIMIT 1', [paymentKey]);
  const payment = paymentRows[0];
  if (!payment) {
    return null;
  }

  const planType = payment.plan_type || paymentDetails?.planType || 'monthly';
  const nextBilling = formatDT(new Date(Date.now() + getPlanDurationMs(planType)));
  const subscriptionKey = `pix:${paymentKey}`;
  const payerEmail = payment.payer_email || paymentDetails?.payerEmail || null;

  let user = null;
  if (payerEmail) {
    const [userRows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [payerEmail]);
    user = userRows[0] || null;
  }

  if (!user && payerEmail) {
    const bcrypt = require('bcryptjs');
    const tenantId = `T-${Date.now()}`;
    const userId = `U-${Date.now()}`;
    const passwordHash = await bcrypt.hash(uuidv4(), 10);

    await db.query('INSERT INTO tenants (id, company_name) VALUES (?, ?)', [tenantId, 'Empresa Pagante']);
    await db.query('INSERT INTO users (id, email, password_hash, tenant_id, access_status) VALUES (?, ?, ?, ?, ?)', [
      userId,
      payerEmail,
      passwordHash,
      tenantId,
      'paid',
    ]);
    user = { id: userId };
  }

  if (user) {
    await setUserAccessStatus(user.id, 'paid');

    const [existingSubscriptions] = await db.query(
      'SELECT id FROM subscriptions WHERE mpSubscriptionId = ? LIMIT 1',
      [subscriptionKey]
    );

    if (existingSubscriptions[0]) {
      await db.query(
        'UPDATE subscriptions SET status = ?, planType = ?, nextBilling = ?, gracePeriodUntil = NULL WHERE mpSubscriptionId = ?',
        ['paid', planType, nextBilling, subscriptionKey]
      );
    } else {
      await db.query(
        'INSERT INTO subscriptions (userId, mpSubscriptionId, status, planType, nextBilling) VALUES (?, ?, ?, ?, ?)',
        [user.id, subscriptionKey, 'paid', planType, nextBilling]
      );
    }
  }

  await db.query('UPDATE payments SET status = ? WHERE mp_payment_id = ?', ['approved', paymentKey]);

  return {
    paymentId: paymentKey,
    planType,
    nextBilling,
    payerEmail,
    userId: user?.id || null,
  };
}

// GET /plans: Retorna os planos existentes no banco
router.get('/plans', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM plans');
    
    // Se não houver planos, retorna nulo mas com status 200 (evita erro 500 no frontend)
    if (!rows || rows.length === 0) {
      return res.json({ monthlyPlan: null, annualPlan: null });
    }

    const plans = rows.reduce((acc, p) => {
      acc[p.planType] = p;
      return acc;
    }, {});
    
    res.json({ 
      monthlyPlan: plans.monthly || null, 
      annualPlan: plans.annual || null 
    });
  } catch (error) {
    console.error('❌ [GET Plans Error]:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar planos no banco de dados', 
      details: error.message,
      hint: 'Verifique se a tabela "plans" existe e se as credenciais do DB no .env estão corretas.'
    });
  }
});

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
    } else {
      const monthlyBody = buildPlanBody({ planType: 'monthly', price: monthlyPlan.price, frequency: monthlyPlan.frequency, frequencyType: monthlyPlan.frequencyType });
      await syncMPPlanTrial(monthlyPlan.mpPlanId, monthlyBody);
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
    } else {
      const annualBody = buildPlanBody({ planType: 'annual', price: annualPlan.price, frequency: annualPlan.frequency, frequencyType: annualPlan.frequencyType });
      await syncMPPlanTrial(annualPlan.mpPlanId, annualBody);
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
    const { email, planType, expiresAt } = req.body;
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

    const deferredExpiration = parsePixExpiration(expiresAt);
    if (deferredExpiration) {
      body.date_of_expiration = deferredExpiration;
    }

    const { mpPayment } = getMP();
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
      JSON.stringify({ qrCode, qrCodeBase64, mp: result, deferredExpiration })
    ]);

    return res.status(201).json({
      paymentId: result?.id,
      status: result?.status,
      qrCode,
      qrCodeBase64,
      expiresAt: result?.date_of_expiration || deferredExpiration || null,
    });
  } catch (error) {
    console.error('❌ [PIX Error]:', error.message);
    if (error.response) {
      console.error('MP Data Error:', JSON.stringify(error.response, null, 2));
      return res.status(500).json({ 
        error: 'Erro na API do Mercado Pago ao criar PIX', 
        details: error.message,
        mp_details: error.response 
      });
    }
    return res.status(500).json({ error: 'Erro interno ao criar pagamento PIX', details: error.message });
  }
});

// GET /pix/status/:paymentId: Consulta status do pagamento PIX
router.get('/pix/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) return res.status(400).json({ error: 'paymentId é obrigatório' });

    const { mpPayment } = getMP();
    const result = await mpPayment.get({ id: paymentId });
    if (result?.status) {
      await db.query('UPDATE payments SET status = ? WHERE mp_payment_id = ?', [result.status, paymentId]);
      if (result.status === 'approved') {
        await activatePixAccess(paymentId, {
          planType: req.query.planType || null,
          payerEmail: req.query.email || null,
        });
      }
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
    const planBody = buildPlanBody({
      planType,
      price: plan.price,
      frequency: plan.frequency,
      frequencyType: plan.frequencyType,
    });
    await syncMPPlanTrial(plan.mpPlanId, planBody);

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
    const baseFrontendUrl = process.env.FRONTEND_URL_PRODUCTION || process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:5173');
    if (!baseFrontendUrl) {
      throw new Error('FRONTEND_URL_PRODUCTION não está configurada para produção');
    }
    const successUrl = process.env.MP_SUCCESS_URL || `${baseFrontendUrl}/sucesso`;

    // Cria assinatura no Mercado Pago
    const body = {
      preapproval_plan_id: plan.mpPlanId,
      payer_email: email,
      card_token_id: token,
      back_url: successUrl,
      status: 'authorized',
    };
    const { preApproval } = getMP();
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

    await setUserAccessStatus(user.id, 'paid');

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

    if (!isProduction) {
      console.log('[Webhook] Recebido MP Notificação:', payload.type, 'Action:', payload.action);
    }

    if (payload.type !== 'preapproval' && payload.action !== 'payment.created' && payload.action !== 'payment.updated') {
      return res.status(200).send('ignorado');
    }

    if (payload.type === 'preapproval') {
      const mpSubscriptionId = payload.data && payload.data.id;
      if (!mpSubscriptionId) return res.status(400).send('id ausente');
      
      const [rows] = await db.query('SELECT * FROM subscriptions WHERE mpSubscriptionId = ? LIMIT 1', [mpSubscriptionId]);
      const subscription = rows[0];

      if (subscription) {
        const { preApproval } = getMP();
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

          if (["authorized", "active", "paid", "approved"].includes(newStatus)) {
            await setUserAccessStatus(subscription.userId, 'paid');
          } else if (gracePeriodUntil) {
            await setUserAccessStatus(subscription.userId, 'grace');
          }
        }
      }
    } else if (payload.action && payload.action.startsWith('payment')) {
      const paymentId = payload.data && payload.data.id;
      if (paymentId) {
        const { mpPayment } = getMP();
        const result = await mpPayment.get({ id: paymentId });
        if (result?.status) {
          await db.query('UPDATE payments SET status = ? WHERE mp_payment_id = ?', [result.status, paymentId]);
          if (result.status === 'approved') {
            await activatePixAccess(paymentId, {
              payerEmail: result.payer?.email || null,
            });
          }
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
