import axios from 'axios';

const RAW_BASE = import.meta.env.VITE_API_URL;
const API_BASE = RAW_BASE ? (RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`) : '/api';
const API = API_BASE.endsWith('/payments') ? API_BASE : `${API_BASE}/payments`;

export async function getPlans() {
  const { data } = await axios.post(`${API}/plans`);
  return data;
}

export async function createSubscription({ email, token, planType }: { email: string; token: string; planType: 'monthly' | 'annual' }) {
  const { data } = await axios.post(`${API}/subscriptions`, { email, token, planType });
  return data;
}

export async function createPixPayment({ email, planType }: { email: string; planType: 'monthly' | 'annual' }) {
  const { data } = await axios.post(`${API}/pix`, { email, planType });
  return data as { paymentId: string; status: string; qrCode: string | null; qrCodeBase64: string | null; expiresAt?: string | null };
}

export async function getPixPaymentStatus(paymentId: string) {
  const { data } = await axios.get(`${API}/pix/status/${paymentId}`);
  return data as { paymentId: string; status: string; detail?: string | null };
}

export async function getSubscription(id: string) {
  const { data } = await axios.get(`${API}/subscriptions/${id}`);
  return data;
}
