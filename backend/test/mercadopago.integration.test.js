const request = require('supertest');

const mockMercadoPagoState = {
  paymentCreateResponse: null,
  paymentGetResponse: null,
  preApprovalCreateResponse: null,
  preApprovalFindByIdResponse: null,
  preApprovalPlanCreateResponse: null,
};

let mockPaymentSequence = 0;
let mockSubscriptionSequence = 0;

const mockDbState = {
  payments: [],
  tenants: [],
  users: [],
  subscriptions: [],
  plans: [],
};

function resetDbState() {
  mockDbState.payments = [];
  mockDbState.tenants = [];
  mockDbState.users = [];
  mockDbState.subscriptions = [];
  mockDbState.plans = [];
  mockPaymentSequence = 0;
  mockSubscriptionSequence = 0;
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, ' ').trim().toLowerCase();
}

function cloneRow(row) {
  return row ? JSON.parse(JSON.stringify(row)) : row;
}

function findPaymentByMpId(mpPaymentId) {
  return mockDbState.payments.find((payment) => payment.mp_payment_id === mpPaymentId) || null;
}

function findUserByEmail(email) {
  return mockDbState.users.find((user) => user.email === email) || null;
}

function findUserById(id) {
  return mockDbState.users.find((user) => user.id === id) || null;
}

function findSubscriptionByMpId(mpSubscriptionId) {
  return mockDbState.subscriptions.find((subscription) => subscription.mpSubscriptionId === mpSubscriptionId) || null;
}

const mockDb = {};

mockDb.query = jest.fn(async (sql, params = []) => {
  const normalized = normalizeSql(sql);

  if (normalized.includes('select * from payments where mp_payment_id = ? limit 1')) {
    const row = findPaymentByMpId(params[0]);
    return [[cloneRow(row)]];
  }

  if (normalized.startsWith('insert into payments')) {
    const [id, planType, status, amount, currency, mpPaymentId, payerEmail, idempotencyKey, rawPayload] = params;
    mockDbState.payments.push({
      id,
      plan_type: planType,
      status,
      amount,
      currency,
      mp_payment_id: mpPaymentId,
      payer_email: payerEmail,
      idempotency_key: idempotencyKey,
      raw_payload: rawPayload,
    });
    return [{ insertId: id }];
  }

  if (normalized.includes('update payments set status = ? where mp_payment_id = ?')) {
    const [status, mpPaymentId] = params;
    const payment = findPaymentByMpId(mpPaymentId);
    if (payment) {
      payment.status = status;
    }
    return [{ affectedRows: payment ? 1 : 0 }];
  }

  if (normalized.includes('select * from users where email = ? limit 1')) {
    const row = findUserByEmail(params[0]);
    return [[cloneRow(row)]];
  }

  if (normalized.includes('insert into tenants (id, company_name) values (?, ?)')) {
    const [id, companyName] = params;
    mockDbState.tenants.push({
      id,
      company_name: companyName,
    });
    return [{ insertId: id }];
  }

  if (normalized.startsWith('insert into users')) {
    const [id, email, passwordHash, tenantId, accessStatus] = params;
    mockDbState.users.push({
      id,
      email,
      password_hash: passwordHash,
      tenant_id: tenantId,
      access_status: accessStatus || 'trial',
    });
    return [{ insertId: id }];
  }

  if (normalized.includes('update users set access_status = ? where id = ?')) {
    const [accessStatus, userId] = params;
    const user = findUserById(userId);
    if (user) {
      user.access_status = accessStatus;
    }
    return [{ affectedRows: user ? 1 : 0 }];
  }

  if (normalized.includes('select * from subscriptions where mpsubscriptionid = ? limit 1')) {
    const row = findSubscriptionByMpId(params[0]);
    return [[cloneRow(row)]];
  }

  if (normalized.startsWith('insert into subscriptions')) {
    const [userId, mpSubscriptionId, status, planType, nextBilling] = params;
    const record = {
      id: ++mockSubscriptionSequence,
      userId,
      mpSubscriptionId,
      status,
      planType,
      nextBilling,
      gracePeriodUntil: null,
    };
    mockDbState.subscriptions.push(record);
    return [{ insertId: record.id }];
  }

  if (normalized.includes('update subscriptions set status = ?, plantype = ?, nextbilling = ?, graceperioduntil = null where mpsubscriptionid = ?')) {
    const [status, planType, nextBilling, mpSubscriptionId] = params;
    const subscription = findSubscriptionByMpId(mpSubscriptionId);
    if (subscription) {
      subscription.status = status;
      subscription.planType = planType;
      subscription.nextBilling = nextBilling;
      subscription.gracePeriodUntil = null;
    }
    return [{ affectedRows: subscription ? 1 : 0 }];
  }

  if (normalized.includes('select * from subscriptions where id = ?')) {
    const id = Number(params[0]);
    const row = mockDbState.subscriptions.find((subscription) => subscription.id === id) || null;
    return [[cloneRow(row)]];
  }

  if (normalized.includes('select * from plans')) {
    return [mockDbState.plans.map(cloneRow)];
  }

  return [[]];
});

mockDb.getConnection = jest.fn(async () => ({
  release: jest.fn(),
  query: mockDb.query,
}));

const mockAccessControl = {
  setUserAccessStatus: jest.fn(async (userId, accessStatus) => {
    const user = findUserById(userId);
    if (user) {
      user.access_status = accessStatus;
    }
  }),
  reconcileUserAccess: jest.fn(),
  evaluateSubscriptionAccess: jest.fn(),
  ensureUserTrial: jest.fn(),
};

jest.mock('mercadopago', () => {
  class MercadoPagoConfig {
    constructor(options) {
      this.options = options;
    }
  }

  class PreApprovalPlan {
    async create() {
      return mockMercadoPagoState.preApprovalPlanCreateResponse || { id: `plan-${Date.now()}` };
    }
  }

  class PreApproval {
    async create() {
      return (
        mockMercadoPagoState.preApprovalCreateResponse || {
          id: `sub-${Date.now()}`,
          status: 'authorized',
          auto_recurring: {
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );
    }

    async findById() {
      return (
        mockMercadoPagoState.preApprovalFindByIdResponse || {
          status: 'authorized',
          auto_recurring: {
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );
    }
  }

  class Payment {
    async create() {
      mockPaymentSequence += 1;
      const sequence = mockPaymentSequence;
      const response =
        mockMercadoPagoState.paymentCreateResponse || {
          id: `pay-${sequence}`,
          status: 'pending',
          currency_id: 'BRL',
          point_of_interaction: {
            transaction_data: {
              qr_code: `qr-code-${sequence}`,
              qr_code_base64: `base64-${sequence}`,
            },
          },
        };
      return response;
    }

    async get({ id }) {
      return (
        mockMercadoPagoState.paymentGetResponse || {
          id,
          status: 'approved',
          status_detail: 'accredited',
          payer: {
            email: 'jest@exemplo.com',
          },
        }
      );
    }
  }

  return {
    MercadoPagoConfig,
    PreApproval,
    PreApprovalPlan,
    Payment,
  };
});

jest.mock('uuid', () => ({
  v4: () => 'uuid-mock-1',
}));

jest.mock('../src/config/database', () => mockDb);
jest.mock('../src/services/accessControl.cjs', () => mockAccessControl);

const app = require('../src/app');

function setNextPaymentCreateResponse(overrides = {}) {
  mockPaymentSequence += 1;
  const sequence = mockPaymentSequence;
  mockMercadoPagoState.paymentCreateResponse = {
    id: `pay-${sequence}`,
    status: 'pending',
    currency_id: 'BRL',
    point_of_interaction: {
      transaction_data: {
        qr_code: `qr-code-${sequence}`,
        qr_code_base64: `base64-${sequence}`,
      },
    },
    ...overrides,
  };
  return mockMercadoPagoState.paymentCreateResponse;
}

function setNextPaymentGetResponse(status, overrides = {}) {
  mockMercadoPagoState.paymentGetResponse = {
    status,
    status_detail: status === 'approved' ? 'accredited' : `${status}_detail`,
    payer: {
      email: 'jest@exemplo.com',
    },
    ...overrides,
  };
  return mockMercadoPagoState.paymentGetResponse;
}

async function createPixPayment() {
  const createResponse = setNextPaymentCreateResponse();
  const res = await request(app)
    .post('/api/payments/pix')
    .send({
      email: 'jest@exemplo.com',
      planType: 'monthly',
    });

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({
    paymentId: createResponse.id,
    status: createResponse.status,
    qrCode: createResponse.point_of_interaction.transaction_data.qr_code,
    qrCodeBase64: createResponse.point_of_interaction.transaction_data.qr_code_base64,
  });

  return createResponse.id;
}

describe('Mercado Pago Integration', () => {
  beforeEach(() => {
    resetDbState();
    jest.clearAllMocks();
    mockMercadoPagoState.paymentCreateResponse = null;
    mockMercadoPagoState.paymentGetResponse = null;
    mockMercadoPagoState.preApprovalCreateResponse = null;
    mockMercadoPagoState.preApprovalFindByIdResponse = null;
    mockMercadoPagoState.preApprovalPlanCreateResponse = null;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deve criar um pagamento PIX', async () => {
    const paymentId = await createPixPayment();

    const storedPayment = mockDbState.payments.find((payment) => payment.mp_payment_id === paymentId);
    expect(storedPayment).toBeTruthy();
    expect(storedPayment.plan_type).toBe('monthly');
    expect(storedPayment.status).toBe('pending');
    expect(storedPayment.payer_email).toBe('jest@exemplo.com');
  });

  it('deve consultar o status de um pagamento PIX', async () => {
    const paymentId = await createPixPayment();
    setNextPaymentGetResponse('approved');

    const res = await request(app).get(`/api/payments/pix/status/${paymentId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      paymentId,
      status: 'approved',
      detail: 'accredited',
    });

    const updatedPayment = mockDbState.payments.find((payment) => payment.mp_payment_id === paymentId);
    expect(updatedPayment.status).toBe('approved');
  });

  it('deve ignorar webhook não suportado', async () => {
    const res = await request(app)
      .post('/api/payments/webhooks')
      .set('Content-Type', 'application/json')
      .send({
        type: 'merchant_order',
        action: 'merchant_order.created',
        data: { id: '123' },
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('ignorado');
  });

  it('deve processar webhook de pagamento aprovado', async () => {
    const paymentId = await createPixPayment();
    setNextPaymentGetResponse('approved', {
      payer: {
        email: 'jest@exemplo.com',
      },
    });

    const payload = {
      type: 'payment',
      action: 'payment.updated',
      data: { id: paymentId },
    };

    const res = await request(app)
      .post('/api/payments/webhooks')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');

    const updatedPayment = mockDbState.payments.find((payment) => payment.mp_payment_id === paymentId);
    expect(updatedPayment.status).toBe('approved');
    expect(mockAccessControl.setUserAccessStatus).toHaveBeenCalledWith(expect.any(String), 'paid');
    expect(mockDbState.users).toHaveLength(1);
    expect(mockDbState.subscriptions).toHaveLength(1);
  });

  it('deve atualizar diferentes status de pagamento no webhook', async () => {
    const cases = ['approved', 'rejected', 'pending'];

    for (const status of cases) {
      const paymentId = await createPixPayment();
      setNextPaymentGetResponse(status, {
        payer: {
          email: 'jest@exemplo.com',
        },
      });

      const payload = {
        type: 'payment',
        action: 'payment.updated',
        data: { id: paymentId },
      };

      const res = await request(app)
        .post('/api/payments/webhooks')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      const updatedPayment = mockDbState.payments.find((payment) => payment.mp_payment_id === paymentId);
      expect(updatedPayment.status).toBe(status);
    }
  });
});
