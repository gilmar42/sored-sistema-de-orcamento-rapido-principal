const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const crypto = require('crypto');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Utilitário para gerar refresh token seguro
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { companyName, email, password } = req.body;

    if (!companyName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create tenant
    const tenantId = `T-${Date.now()}`;
    db.prepare('INSERT INTO tenants (id, company_name) VALUES (?, ?)').run(tenantId, companyName);

    // Create user
    const userId = `U-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, email, password_hash, tenant_id) VALUES (?, ?, ?, ?)').run(
      userId,
      email,
      passwordHash,
      tenantId
    );

    // Create default category (unique id per tenant)
    const categoryId = `C-${Date.now()}`;
    db.prepare('INSERT INTO categories (id, name, tenant_id) VALUES (?, ?, ?)').run(
      categoryId,
      'Geral',
      tenantId
    );

    // Create default settings
    db.prepare(`
      INSERT INTO settings (id, company_name, company_contact, company_logo, default_tax, tenant_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `S-${Date.now()}`,
      companyName,
      '',
      '',
      0,
      tenantId
    );

    // Send welcome email with tenant ID and user ID
    sendWelcomeEmail({
      to: email,
      companyName,
      tenantId,
      userId,
    }).catch((err) => console.error('Failed to send welcome email:', err));

    // Generate tokens
    const token = jwt.sign({ userId, email, tenantId }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
      .run(`RT-${Date.now()}`, userId, refreshToken, expiresAt);

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({
      user: {
        id: userId,
        email,
        tenantId,
      },
    });
  } catch (error) {
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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, tenantId: user.tenant_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
      .run(`RT-${Date.now()}`, user.id, refreshToken, expiresAt);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenant_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ user: decoded });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
