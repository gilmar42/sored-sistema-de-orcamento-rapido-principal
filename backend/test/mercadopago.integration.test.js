// Teste automatizado da integração Mercado Pago usando supertest e jest
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Mercado Pago Integration', () => {
  let preferenceId;

  afterAll(() => {
    db.close && db.close();
  });

  it('deve criar uma preferência de pagamento', async () => {
    const res = await request(app)
      .post('/api/payments/preference')
      .set('Idempotency-Key', 'jest-test-1')
      .send({ planType: 'monthly', customerEmail: 'jest@exemplo.com' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('preferenceId');
    preferenceId = res.body.preferenceId;
  });

  it('deve consultar o status do pagamento', async () => {
    const res = await request(app)
      .get(`/api/payments/status/${preferenceId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('planType');
  });

  it('deve ignorar webhook inválido', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-signature', 'ts=123,v1=invalid')
      .set('x-event-type', 'payment')
      .send({ type: 'payment', data: { id: '123' } });
    expect(res.status).toBe(401);
  });

  it('deve aceitar webhook com assinatura válida', async () => {
    // Simula payload e assinatura HMAC válida
    const payload = {
      type: 'payment',
      data: { id: 'jest-payment-id' },
      action: 'payment.created',
    };
    const rawPayload = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000).toString();
    const url = '/api/payments/webhook';
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET || 'test_secret';
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(ts + url + rawPayload);
    const v1 = hmac.digest('hex');
    const signature = `ts=${ts}, v1=${v1}`;

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-signature', signature)
      .set('x-event-type', 'payment')
      .set('Content-Type', 'application/json')
      .send(rawPayload);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('received', true);
  });

  it('deve processar diferentes status de pagamento', async () => {
    const statuses = ['approved', 'rejected', 'pending'];
    for (const status of statuses) {
      // Simula payload Mercado Pago
      const paymentId = `jest-payment-${status}`;
      const preferenceId = 'jest-pref-id';
      // Insere pagamento fake no banco para simular preferência
      db.prepare(`INSERT OR IGNORE INTO payments (id, plan_type, status, amount, currency, mp_preference_id, mp_payment_id, payer_email, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(paymentId, 'monthly', 'pending', 100, 'BRL', preferenceId, null, 'jest@exemplo.com', '{}');

      // Simula resposta da API Mercado Pago
      const paymentApi = require('../src/routes/payments');
      // Monta payload do webhook
      const payload = {
        type: 'payment',
        data: { id: paymentId },
        action: 'payment.updated',
      };
      const rawPayload = JSON.stringify(payload);
      const ts = Math.floor(Date.now() / 1000).toString();
      const url = '/api/payments/webhook';
      const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET || 'test_secret';
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(ts + url + rawPayload);
      const v1 = hmac.digest('hex');
      const signature = `ts=${ts}, v1=${v1}`;

      // Mocka chamada ao paymentApi.findById
      jest.spyOn(require('mercadopago').Payment.prototype, 'findById').mockResolvedValueOnce({
        body: {
          order: { id: preferenceId },
          metadata: { planType: 'monthly', preference_id: preferenceId },
          status,
          payer: { email: 'jest@exemplo.com' },
          transaction_amount: 100,
          currency_id: 'BRL',
        },
      });

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-signature', signature)
        .set('x-event-type', 'payment')
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('received', true);

      // Verifica se o status foi atualizado no banco
      const updated = db.prepare('SELECT * FROM payments WHERE mp_preference_id = ?').get(preferenceId);
      expect(updated.status).toBe(status);
    }
  });
});
