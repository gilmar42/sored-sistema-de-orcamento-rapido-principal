// Mock para paymentService - evita erros com import.meta.env em testes Jest
export const getPlans = jest.fn().mockResolvedValue({
  monthly: { id: 'monthly', name: 'Monthly', price: 29.9 },
  annual: { id: 'annual', name: 'Annual', price: 299 },
});

export const createSubscription = jest
  .fn()
  .mockImplementation(({ email, token, planType }: { email: string; token: string; planType: 'monthly' | 'annual' }) => ({
    success: true,
    subscriptionId: 'mock-subscription-id',
    email,
    planType,
    token,
  }));

export const createPixPayment = jest
  .fn()
  .mockImplementation(({ email, planType }: { email: string; planType: 'monthly' | 'annual' }) => ({
    paymentId: 'mock-payment-id',
    status: 'pending',
    qrCode: 'mock-qr-code',
    qrCodeBase64: 'data:image/png;base64,mock',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    email,
    planType,
  }));

export const getPixPaymentStatus = jest
  .fn()
  .mockImplementation((paymentId: string) => ({
    paymentId,
    status: 'pending',
    detail: null,
  }));

export const getSubscription = jest
  .fn()
  .mockImplementation((id: string) => ({
    id,
    status: 'active',
    planType: 'monthly',
    email: 'test@example.com',
  }));
