const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const STORE_PATH = path.resolve(__dirname, '..', '..', 'data', 'auth-fallback.json');

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
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
      refreshTokens: Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens : [],
    };
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
  const existingUser = state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
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
    email,
    passwordHash,
    tenantId,
    name: null,
    trialStartedAt: trial.trialStartedAt,
    trialEndsAt: trial.trialEndsAt,
    accessStatus: 'trial',
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
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

async function findUserById(userId) {
  const state = await loadState();
  return state.users.find((user) => user.id === userId) || null;
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
    user.trialEndsAt = trial.trialEndsAt;
    user.accessStatus = user.accessStatus || 'trial';
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
