const express = require('express');
const crypto = require('crypto');
// Integração Mercado Pago removida
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const router = express.Router();

// Busca pagamento por idempotency_key
function getPaymentByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) return null;
  try {
    return db.prepare('SELECT * FROM payments WHERE idempotency_key = ?').get(idempotencyKey);
  } catch (err) {
    console.error('[getPaymentByIdempotencyKey] DB error:', err);
    return null;
  }
}

// Extrai initPoint e sandboxInitPoint do campo raw_payload do registro do banco
function parseInitPoints(paymentRow) {
  if (!paymentRow || !paymentRow.raw_payload) return { initPoint: null, sandboxInitPoint: null };
  try {
    const payload = typeof paymentRow.raw_payload === 'string' ? JSON.parse(paymentRow.raw_payload) : paymentRow.raw_payload;
    return {
      initPoint: payload.initPoint || null,
      sandboxInitPoint: payload.sandboxInitPoint || null
    };
  } catch (err) {
    console.error('[parseInitPoints] JSON parse error:', err);
    return { initPoint: null, sandboxInitPoint: null };
  }
}

// Atualiza ou insere status do pagamento no banco
function upsertPaymentStatus({ planType, status, amount, currency, preferenceId, paymentId, payerEmail, rawPayload }) {
  if (!preferenceId) return;
  try {
    const existing = db.prepare('SELECT * FROM payments WHERE mp_preference_id = ?').get(preferenceId);
    if (existing) {
      db.prepare(`UPDATE payments SET status = ?, mp_payment_id = ?, payer_email = ?, raw_payload = ?, updated_at = CURRENT_TIMESTAMP WHERE mp_preference_id = ?`).run(
        status,
        paymentId || existing.mp_payment_id,
        payerEmail || existing.payer_email,
        rawPayload || existing.raw_payload,
        preferenceId
      );
    } else {
      db.prepare(`INSERT INTO payments (id, plan_type, status, amount, currency, mp_preference_id, mp_payment_id, payer_email, raw_payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run(
        uuidv4(),
        planType || 'monthly',
        status || 'unknown',
        amount || 0,
        currency || 'BRL',
        preferenceId,
        paymentId || null,
        payerEmail || null,
        rawPayload || null
      );
    }
  } catch (err) {
    console.error('[upsertPaymentStatus] DB error:', err);
  }
}
// Variáveis Mercado Pago removidas

// Rota Mercado Pago removida

// Rota Mercado Pago removida

// Rota Mercado Pago removida

module.exports = router;
