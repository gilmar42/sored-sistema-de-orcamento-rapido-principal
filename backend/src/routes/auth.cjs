const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { reconcileUserAccess, ensureUserTrial } = require('../services/accessControl.cjs');
const {
  isDatabaseUnavailable,
  createTenantUserAndTrial,
  findUserByEmail,
  findUserById,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  reconcileAccess: reconcileFallbackAccess,
} = require('../services/authFallbackStore.cjs');
const crypto = require('crypto');
const { sendWelcomeEmail } = require('../services/emailService');
const isProduction = process.env.NODE_ENV === 'production';

const router = express.Router();

// Utilitário para gerar refresh token seguro
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function issueSession(res, token, refreshToken) {
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
}

function blockedPayload(access) {
  return {
    error: 'Access blocked',
    reason: access.blockReason,
    accessStatus: access.accessStatus,
    trialEndsAt: access.trialEndsAt,
  };
}

function canUseFallbackAuth(error) {
  return !isProduction && isDatabaseUnavailable(error);
}

async function handleFallbackSignup(req, res) {
  const { companyName, email, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await createTenantUserAndTrial(companyName, email, passwordHash);

    sendWelcomeEmail({
      to: email,
      companyName,
      tenantId: created.tenantId,
      userId: created.userId,
    }).catch((err) => console.error('Failed to send welcome email:', err));

    const access = await reconcileFallbackAccess(created.userId);
    if (!access.allowed) {
      return res.status(403).json(blockedPayload(access));
    }

    const token = jwt.sign({ userId: created.userId, email, tenantId: created.tenantId }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await storeRefreshToken(created.userId, refreshToken, expiresAt);
    issueSession(res, token, refreshToken);

    return res.json({
      user: {
        id: created.userId,
        email,
        tenantId: created.tenantId,
      },
      access,
    });
  } catch (error) {
    if (error && error.code === 'USER_EXISTS') {
      return res.status(400).json({ error: 'User already exists' });
    }
    throw error;
  }
}

async function handleFallbackLogin(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const access = await reconcileFallbackAccess(user.id);
  if (!access.allowed) {
    return res.status(403).json(blockedPayload(access));
  }

  const token = jwt.sign({ userId: user.id, email: user.email, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  await storeRefreshToken(user.id, refreshToken, expiresAt);
  issueSession(res, token, refreshToken);

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
    },
    access,
  });
}

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { companyName, email, password } = req.body;

    if (!companyName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create tenant
    const tenantId = `T-${Date.now()}`;
    await db.query('INSERT INTO tenants (id, company_name) VALUES (?, ?)', [tenantId, companyName]);

    // Create user
    const userId = `U-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (id, email, password_hash, tenant_id) VALUES (?, ?, ?, ?)', [
      userId,
      email,
      passwordHash,
      tenantId
    ]);

    // Create default category (unique id per tenant)
    const categoryId = `C-${Date.now()}`;
    await db.query('INSERT INTO categories (id, name, tenant_id) VALUES (?, ?, ?)', [
      categoryId,
      'Geral',
      tenantId
    ]);

    // Create default settings
    await db.query(`
      INSERT INTO settings (id, company_name, company_contact, company_logo, default_tax, tenant_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `S-${Date.now()}`,
      companyName,
      '',
      '',
      0,
      tenantId
    ]);

    await ensureUserTrial(userId);

    // Send welcome email with tenant ID and user ID
    sendWelcomeEmail({
      to: email,
      companyName,
      tenantId,
      userId,
    }).catch((err) => console.error('Failed to send welcome email:', err));

    const access = await reconcileUserAccess(userId);
    if (!access.allowed) {
      return res.status(403).json({
        error: 'Access blocked',
        reason: access.blockReason,
        accessStatus: access.accessStatus,
        trialEndsAt: access.trialEndsAt,
      });
    }

    // Generate tokens
    const token = jwt.sign({ userId, email, tenantId }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '); // 30 dias MYSQL DATETIME format
    await db.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)', [
      `RT-${Date.now()}`, userId, refreshToken, expiresAt
    ]);

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({
      user: {
        id: userId,
        email,
        tenantId,
      },
      access,
    });
  } catch (error) {
    if (isProduction && isDatabaseUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    if (canUseFallbackAuth(error)) {
      try {
        return await handleFallbackSignup(req, res);
      } catch (fallbackError) {
        if (fallbackError && fallbackError.code === 'USER_EXISTS') {
          return res.status(400).json({ error: 'User already exists' });
        }
        console.error('Fallback signup error:', fallbackError);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const access = await reconcileUserAccess(user.id);
    if (!access.allowed) {
      return res.status(403).json({
        error: 'Access blocked',
        reason: access.blockReason,
        accessStatus: access.accessStatus,
        trialEndsAt: access.trialEndsAt,
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, tenantId: user.tenant_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await db.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)', [
      `RT-${Date.now()}`, user.id, refreshToken, expiresAt
    ]);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenant_id,
      },
      access,
    });
  } catch (error) {
    if (isProduction && isDatabaseUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    if (canUseFallbackAuth(error)) {
      try {
        return await handleFallbackLogin(req, res);
      } catch (fallbackError) {
        if (fallbackError && fallbackError.message === 'Invalid credentials') {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.error('Fallback login error:', fallbackError);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    let access;
    try {
      access = await reconcileUserAccess(decoded.userId);
    } catch (error) {
      if (!canUseFallbackAuth(error)) {
        throw error;
      }
      access = await reconcileFallbackAccess(decoded.userId);
    }
    if (!access.allowed) {
      return res.status(403).json(blockedPayload(access));
    }
    return res.status(200).json({ user: decoded, access });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    try {
      const [tokens] = await db.query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
      const storedToken = tokens[0];

      if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [storedToken.user_id]);
      const user = users[0];

      if (!user) return res.status(401).json({ error: 'User not found' });

      const access = await reconcileUserAccess(user.id);
      if (!access.allowed) {
        return res.status(403).json(blockedPayload(access));
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email, tenantId: user.tenant_id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', newToken, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ user: { id: user.id, email: user.email, tenantId: user.tenant_id }, access });
    } catch (error) {
      if (!canUseFallbackAuth(error)) {
        throw error;
      }

      const storedToken = await getRefreshToken(refreshToken);
      if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const user = await findUserById(storedToken.userId);
      if (!user) return res.status(401).json({ error: 'User not found' });

      const access = await reconcileFallbackAccess(user.id);
      if (!access.allowed) {
        return res.status(403).json(blockedPayload(access));
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email, tenantId: user.tenantId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.cookie('token', newToken, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ user: { id: user.id, email: user.email, tenantId: user.tenantId }, access });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      } catch (error) {
        if (!isDatabaseUnavailable(error)) {
          throw error;
        }
        await deleteRefreshToken(refreshToken);
      }
    }
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});


module.exports = router;
