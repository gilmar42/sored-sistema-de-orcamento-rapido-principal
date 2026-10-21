jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const { evaluateSubscriptionAccess, parseDatabaseDateTime } = require('../src/services/accessControl.cjs');

describe('Subscription access control', () => {
  const now = new Date('2026-10-20T12:00:00.000Z');

  it('allows a paid subscription only through its next billing date', () => {
    expect(evaluateSubscriptionAccess({
      status: 'authorized',
      nextBilling: '2026-10-21 12:00:00',
    }, now)).toMatchObject({ allowed: true, status: 'paid' });

    expect(evaluateSubscriptionAccess({
      status: 'paid',
      nextBilling: '2026-10-19 12:00:00',
    }, now)).toMatchObject({ allowed: false, reason: 'subscription_inactive' });
  });

  it('blocks failed payments immediately, even if an old grace date remains', () => {
    expect(evaluateSubscriptionAccess({
      status: 'failure',
      nextBilling: '2026-10-21 12:00:00',
      gracePeriodUntil: '2026-10-23 12:00:00',
    }, now)).toMatchObject({ allowed: false, status: 'failure' });
  });

  it('parses MySQL DATETIME values as UTC', () => {
    expect(parseDatabaseDateTime('2026-10-21 12:00:00').toISOString())
      .toBe('2026-10-21T12:00:00.000Z');
  });
});
