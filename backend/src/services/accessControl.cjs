const db = require('../config/database');

const TRIAL_DAYS = 5;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['authorized', 'active', 'paid', 'approved']);
const GRACE_SUBSCRIPTION_STATUSES = new Set(['pending', 'failure']);

function toMysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function isFuture(datetime) {
  if (!datetime) return false;
  const value = new Date(datetime);
  return !Number.isNaN(value.getTime()) && value.getTime() > Date.now();
}

async function ensureUserTrial(userId) {
  const [rows] = await db.query(
    'SELECT id, trial_started_at, trial_ends_at, access_status FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  const user = rows[0];
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.trial_started_at || !user.trial_ends_at) {
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    await db.query(
      'UPDATE users SET trial_started_at = COALESCE(trial_started_at, ?), trial_ends_at = COALESCE(trial_ends_at, ?), access_status = COALESCE(access_status, ?) WHERE id = ?',
      [toMysqlDateTime(trialStartedAt), toMysqlDateTime(trialEndsAt), 'trial', userId]
    );
    return {
      ...user,
      trial_started_at: toMysqlDateTime(trialStartedAt),
      trial_ends_at: toMysqlDateTime(trialEndsAt),
      access_status: user.access_status || 'trial',
    };
  }

  return user;
}

async function getLatestSubscriptionForUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM subscriptions WHERE userId = ? ORDER BY id DESC LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

function evaluateSubscriptionAccess(subscription, now = new Date()) {
  if (!subscription) {
    return { allowed: false, status: 'none', reason: 'no_subscription' };
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return { allowed: true, status: 'paid', reason: null };
  }

  if (GRACE_SUBSCRIPTION_STATUSES.has(subscription.status) && isFuture(subscription.gracePeriodUntil)) {
    return { allowed: true, status: 'grace', reason: null };
  }

  return { allowed: false, status: subscription.status || 'unknown', reason: 'subscription_inactive' };
}

async function setUserAccessStatus(userId, accessStatus) {
  await db.query('UPDATE users SET access_status = ? WHERE id = ?', [accessStatus, userId]);
}

async function reconcileUserAccess(userId) {
  const user = await ensureUserTrial(userId);
  const subscription = await getLatestSubscriptionForUser(userId);
  const subscriptionAccess = evaluateSubscriptionAccess(subscription);
  const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const trialActive = trialEndsAt ? trialEndsAt.getTime() >= Date.now() : false;

  let allowed = false;
  let accessStatus = 'blocked';
  let blockReason = 'trial_expired';

  if (subscriptionAccess.allowed) {
    allowed = true;
    accessStatus = subscriptionAccess.status;
    blockReason = null;
  } else if (trialActive) {
    allowed = true;
    accessStatus = 'trial';
    blockReason = null;
  }

  await setUserAccessStatus(userId, accessStatus);

  return {
    allowed,
    accessStatus,
    blockReason,
    trialStartedAt: user.trial_started_at || null,
    trialEndsAt: user.trial_ends_at || null,
    subscriptionStatus: subscription?.status || null,
    subscription,
  };
}

module.exports = {
  TRIAL_DAYS,
  ensureUserTrial,
  reconcileUserAccess,
  setUserAccessStatus,
  evaluateSubscriptionAccess,
};
