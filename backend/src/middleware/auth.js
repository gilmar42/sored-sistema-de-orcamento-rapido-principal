const jwt = require('jsonwebtoken');
const { reconcileUserAccess } = require('../services/accessControl.cjs');
const {
  isDatabaseUnavailable,
  reconcileAccess: reconcileFallbackAccess,
} = require('../services/authFallbackStore.cjs');
const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = async (req, res, next) => {
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
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }
      access = await reconcileFallbackAccess(decoded.userId);
    }
    if (!access.allowed) {
      return res.status(403).json({
        error: 'Access blocked',
        reason: access.blockReason,
        accessStatus: access.accessStatus,
        trialEndsAt: access.trialEndsAt,
      });
    }

    req.user = decoded;
    req.access = access;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
