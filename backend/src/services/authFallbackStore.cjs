const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const STORE_PATH = path.resolve(__dirname, '..', '..', 'data', 'auth-fallback.json');
const DEMO_EMAILS = new Set(['debugteste@example.com']);
const DEMO_EMAIL_SUFFIX = '@sored.demo';
const DEMO_COMPANY_NAMES = new Set(['Empresa Demo', 'Debug Teste']);

const EMPTY_STATE = {
  users: [],
  tenants: [],
  refreshTokens: [],
};

let writeQueue = Promise.resolve();

function toMysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STATE, null, 2), 'utf8');
  }
}

async function loadState() {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeState({
      users: Array.isArray(parsed.users) ? parsed.users : [],
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
      refreshTokens: Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens : [],
    });

    if (
      sanitized.users.length !== (Array.isArray(parsed.users) ? parsed.users.length : 0) ||
      sanitized.tenants.length !== (Array.isArray(parsed.tenants) ? parsed.tenants.length : 0) ||
      sanitized.refreshTokens.length !== (Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens.length : 0)
    ) {
      await saveState(sanitized);
    }

    return sanitized;
  } catch {
    return { ...EMPTY_STATE };
  }
}

async function saveState(nextState) {
  writeQueue = writeQueue.then(async () => {
    await ensureStoreFile();
    await fs.writeFile(STORE_PATH, JSON.stringify(nextState, null, 2), 'utf8');
  });
  return writeQueue;
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isDemoEmail(email) {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  return DEMO_EMAILS.has(normalized) || normalized.endsWith(DEMO_EMAIL_SUFFIX);
}

function isDemoCompanyName(companyName) {
  if (!companyName) return false;
  return DEMO_COMPANY_NAMES.has(String(companyName).trim());
}

function normalizeUserRecord(user) {
  if (!user) return null;
  return {
    ...user,
    passwordHash: user.passwordHash || user.password_hash || null,
    tenantId: user.tenantId || user.tenant_id || null,
    trialStartedAt: user.trialStartedAt || user.trial_started_at || null,
    trialEndsAt: user.trialEndsAt || user.trial_ends_at || null,
    accessStatus: user.accessStatus || user.access_status || 'trial',
  };
}

function sanitizeState(state) {
  const users = Array.isArray(state.users) ? state.users : [];
  const tenants = Array.isArray(state.tenants) ? state.tenants : [];
  const refreshTokens = Array.isArray(state.refreshTokens) ? state.refreshTokens : [];

  const tenantIdsToRemove = new Set();
  for (const tenant of tenants) {
    if (isDemoCompanyName(tenant.companyName)) {
      tenantIdsToRemove.add(tenant.id);
    }
  }

  const cleanedUsers = users.filter((user) => {
    const normalized = normalizeUserRecord(user);
    const shouldRemove = isDemoEmail(normalized?.email) || tenantIdsToRemove.has(normalized?.tenantId);
    if (shouldRemove && normalized?.tenantId) {
      tenantIdsToRemove.add(normalized.tenantId);
    }
    return !shouldRemove;
  });

  const cleanedTenants = tenants.filter(
    (tenant) => !tenantIdsToRemove.has(tenant.id) && !isDemoCompanyName(tenant.companyName)
  );

  const cleanedRefreshTokens = refreshTokens.filter((token) => {
    const linkedUser = cleanedUsers.find((user) => user.id === token.userId);
    return Boolean(linkedUser) && !isDemoEmail(linkedUser.email);
  });

  return {
    users: cleanedUsers,
    tenants: cleanedTenants,
    refreshTokens: cleanedRefreshTokens,
  };
}

function createTrialWindow() {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
  return {
    trialStartedAt: toMysqlDateTime(trialStartedAt),
    trialEndsAt: toMysqlDateTime(trialEndsAt),
  };
}

function isFuture(datetime) {
  if (!datetime) return false;
  const value = new Date(datetime);
  return !Number.isNaN(value.getTime()) && value.getTime() > Date.now();
}

async function createTenantUserAndTrial(companyName, email, passwordHash) {
  const state = await loadState();
  if (isDemoEmail(email) || isDemoCompanyName(companyName)) {
    const error = new Error('Demo accounts are not allowed');
    error.code = 'DEMO_ACCOUNT';
    throw error;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = state.users.find((user) => String(user.email).trim().toLowerCase() === normalizedEmail);
  if (existingUser) {
    const error = new Error('User already exists');
    error.code = 'USER_EXISTS';
    throw error;
  }

  const tenantId = generateId('T');
  const userId = generateId('U');
  const trial = createTrialWindow();

  state.tenants.push({
    id: tenantId,
    companyName,
    createdAt: toMysqlDateTime(new Date()),
  });

  state.users.push({
    id: userId,
    email: normalizedEmail,
    passwordHash,
    tenantId,
    tenant_id: tenantId,
    name: null,
    trialStartedAt: trial.trialStartedAt,
    trial_started_at: trial.trialStartedAt,
    trialEndsAt: trial.trialEndsAt,
    trial_ends_at: trial.trialEndsAt,
    accessStatus: 'trial',
    access_status: 'trial',
  });

  await saveState(state);
  return {
    tenantId,
    userId,
    trialStartedAt: trial.trialStartedAt,
    trialEndsAt: trial.trialEndsAt,
  };
}

async function findUserByEmail(email) {
  const state = await loadState();
  const normalizedEmail = String(email).trim().toLowerCase();
  return normalizeUserRecord(state.users.find((user) => String(user.email).trim().toLowerCase() === normalizedEmail) || null);
}

async function findUserById(userId) {
  const state = await loadState();
  return normalizeUserRecord(state.users.find((user) => user.id === userId) || null);
}

async function storeRefreshToken(userId, token, expiresAt) {
  const state = await loadState();
  const refreshToken = {
    id: generateId('RT'),
    userId,
    token,
    expiresAt,
  };
  state.refreshTokens = state.refreshTokens.filter((entry) => entry.token !== token);
  state.refreshTokens.push(refreshToken);
  await saveState(state);
  return refreshToken;
}

async function getRefreshToken(token) {
  const state = await loadState();
  return state.refreshTokens.find((entry) => entry.token === token) || null;
}

async function deleteRefreshToken(token) {
  const state = await loadState();
  state.refreshTokens = state.refreshTokens.filter((entry) => entry.token !== token);
  await saveState(state);
}

async function setAccessStatus(userId, accessStatus) {
  const state = await loadState();
  const user = state.users.find((entry) => entry.id === userId);
  if (!user) return null;
  user.accessStatus = accessStatus;
  user.access_status = accessStatus;
  await saveState(state);
  return user;
}

async function ensureTrial(userId) {
  const state = await loadState();
  const user = state.users.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.trialStartedAt || !user.trialEndsAt) {
    const trial = createTrialWindow();
    user.trialStartedAt = trial.trialStartedAt;
    user.trial_started_at = trial.trialStartedAt;
    user.trialEndsAt = trial.trialEndsAt;
    user.trial_ends_at = trial.trialEndsAt;
    user.accessStatus = user.accessStatus || 'trial';
    user.access_status = user.accessStatus;
    await saveState(state);
  }

  return user;
}

async function reconcileAccess(userId) {
  const user = await ensureTrial(userId);
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialActive = trialEndsAt ? trialEndsAt.getTime() >= Date.now() : false;

  const allowed = trialActive;
  const accessStatus = trialActive ? 'trial' : 'blocked';
  const blockReason = trialActive ? null : 'trial_expired';

  await setAccessStatus(userId, accessStatus);

  return {
    allowed,
    accessStatus,
    blockReason,
    trialStartedAt: user.trialStartedAt || null,
    trialEndsAt: user.trialEndsAt || null,
    subscriptionStatus: null,
    subscription: null,
  };
}

function isDatabaseUnavailable(error) {
  if (!error) return false;
  const code = error.code || '';
  const message = String(error.message || '').toLowerCase();
  return [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ER_ACCESS_DENIED_ERROR',
  ].includes(code) || message.includes('econnrefused') || message.includes('connection refused');
}

module.exports = {
  isDatabaseUnavailable,
  createTenantUserAndTrial,
  findUserByEmail,
  findUserById,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  reconcileAccess,
  ensureTrial,
  setAccessStatus,
  loadState,
};
