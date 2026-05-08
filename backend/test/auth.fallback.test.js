/** @jest-environment node */
/** @jest-environment node */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock('../src/services/authFallbackStore.cjs', () => ({
  isDatabaseUnavailable: jest.fn(),
  createTenantUserAndTrial: jest.fn(),
  mirrorUserToFallbackStore: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  storeRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
  reconcileAccess: jest.fn(),
  syncFromMySQL: jest.fn(),
}));

jest.mock('../src/services/accessControl.cjs', () => ({
  reconcileUserAccess: jest.fn(),
  ensureUserTrial: jest.fn(),
}));

const app = require('../src/app.cjs');
const db = require('../src/config/database');
const fallbackStore = require('../src/services/authFallbackStore.cjs');
const accessControl = require('../src/services/accessControl.cjs');
const { JWT_SECRET } = require('../src/middleware/auth');

const mockUser = {
  id: 'U-123',
  email: 'fallback@example.com',
  tenantId: 'T-123',
};

beforeEach(() => {
  jest.clearAllMocks();
  db.query.mockReset();
  db.getConnection.mockReset();
  fallbackStore.isDatabaseUnavailable.mockReset();
  fallbackStore.createTenantUserAndTrial.mockReset();
  fallbackStore.mirrorUserToFallbackStore.mockReset();
  fallbackStore.findUserByEmail.mockReset();
  fallbackStore.findUserById.mockReset();
  fallbackStore.storeRefreshToken.mockReset();
  fallbackStore.getRefreshToken.mockReset();
  fallbackStore.deleteRefreshToken.mockReset();
  fallbackStore.reconcileAccess.mockReset();
  fallbackStore.syncFromMySQL.mockReset();
  accessControl.reconcileUserAccess.mockReset();
  accessControl.ensureUserTrial.mockReset();
});

describe('Auth fallback regression', () => {
  it('should verify using fallback store when primary user lookup fails', async () => {
    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email, tenantId: mockUser.tenantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    accessControl.reconcileUserAccess.mockRejectedValue(new Error('User not found'));
    fallbackStore.reconcileAccess.mockResolvedValue({
      allowed: true,
      accessStatus: 'trial',
      trialEndsAt: null,
      blockReason: null,
    });

    const response = await request(app)
      .get('/api/auth/verify')
      .set('Cookie', [`token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      tenantId: mockUser.tenantId,
    });
    expect(response.body.access).toMatchObject({
      allowed: true,
      accessStatus: 'trial',
    });
    expect(accessControl.reconcileUserAccess).toHaveBeenCalledWith(mockUser.id);
    expect(fallbackStore.reconcileAccess).toHaveBeenCalledWith(mockUser.id);
  });

  it('should refresh token using fallback store when primary refresh token is missing', async () => {
    const refreshToken = 'refresh-token-123';
    const storedToken = {
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const fallbackUser = {
      id: mockUser.id,
      email: mockUser.email,
      tenantId: mockUser.tenantId,
    };

    db.query.mockImplementation(async (sql) => {
      if (String(sql).toLowerCase().includes('select * from refresh_tokens where token = ?')) {
        return [[]];
      }
      return [[]];
    });

    fallbackStore.getRefreshToken.mockResolvedValue(storedToken);
    fallbackStore.findUserById.mockResolvedValue(fallbackUser);
    fallbackStore.reconcileAccess.mockResolvedValue({
      allowed: true,
      accessStatus: 'trial',
      trialEndsAt: null,
      blockReason: null,
    });

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      tenantId: mockUser.tenantId,
    });
    expect(response.body.access).toMatchObject({
      allowed: true,
      accessStatus: 'trial',
    });
    expect(fallbackStore.getRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(fallbackStore.findUserById).toHaveBeenCalledWith(mockUser.id);
    expect(fallbackStore.reconcileAccess).toHaveBeenCalledWith(mockUser.id);
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('token=')]));
  });

  it('should login using fallback store when MySQL is unavailable', async () => {
    const password = 'secret123';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query.mockRejectedValue(new Error('connect ECONNREFUSED'));
    fallbackStore.findUserByEmail.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      passwordHash: hashedPassword,
      tenantId: mockUser.tenantId,
    });
    fallbackStore.reconcileAccess.mockResolvedValue({
      allowed: true,
      accessStatus: 'trial',
      trialEndsAt: null,
      blockReason: null,
    });
    fallbackStore.storeRefreshToken.mockResolvedValue({
      userId: mockUser.id,
      token: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      tenantId: mockUser.tenantId,
    });
    expect(fallbackStore.findUserByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(fallbackStore.storeRefreshToken).toHaveBeenCalledWith(mockUser.id, expect.any(String), expect.any(String));
  });

  it('should login using fallback store when user is missing in MySQL but exists in fallback', async () => {
    const password = 'secret123';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query.mockImplementation(async (sql) => {
      if (String(sql).toLowerCase().includes('select * from users where lower(trim(email)) = ?')) {
        return [[]];
      }
      return [[]];
    });

    fallbackStore.findUserByEmail.mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      passwordHash: hashedPassword,
      tenantId: mockUser.tenantId,
    });
    fallbackStore.reconcileAccess.mockResolvedValue({
      allowed: true,
      accessStatus: 'trial',
      trialEndsAt: null,
      blockReason: null,
    });
    fallbackStore.storeRefreshToken.mockResolvedValue({
      userId: mockUser.id,
      token: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      tenantId: mockUser.tenantId,
    });
    expect(fallbackStore.findUserByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(fallbackStore.storeRefreshToken).toHaveBeenCalledWith(mockUser.id, expect.any(String), expect.any(String));
  });

  it('should logout and delete fallback refresh token when MySQL is unavailable', async () => {
    const refreshToken = 'logout-refresh-123';
    const dbError = new Error('connect ECONNREFUSED');
    dbError.code = 'ECONNREFUSED';

    db.query.mockRejectedValue(dbError);
    fallbackStore.isDatabaseUnavailable.mockReturnValue(true);
    fallbackStore.deleteRefreshToken.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(fallbackStore.deleteRefreshToken).toHaveBeenCalledWith(refreshToken);
  });

  it('should return synced users count for sync-fallback route', async () => {
    fallbackStore.syncFromMySQL.mockResolvedValue(3);

    const response = await request(app)
      .post('/api/auth/sync-fallback');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, syncedUsers: 3 });
    expect(fallbackStore.syncFromMySQL).toHaveBeenCalledWith(db);
  });
});
