// Arquivo renomeado para app.cjs
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.cjs');
const materialsRoutes = require('./routes/materials.cjs');
const quotesRoutes = require('./routes/quotes.cjs');
const clientsRoutes = require('./routes/clients.cjs');
const categoriesRoutes = require('./routes/categories.cjs');
const settingsRoutes = require('./routes/settings.cjs');
const paymentsRoutes = require('./routes/payment.cjs');

// Inicializa MySQL
require('./config/database');

const app = express();

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3007',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3007',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://192.168.0.104:3000',
  'http://192.168.0.104:3001',
  'http://192.168.0.104:3007',
  'http://192.168.0.104:5173',
  'https://sord-sistema-de-or-amento-rapido-pr-seven.vercel.app',
];

const envOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL_PRODUCTION].filter(Boolean);
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

// Middleware CORS (dev + produção via env)
app.use((req, res, next) => {
  console.log('[CORS DEBUG] Origin:', req.headers.origin);
  next();
});
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200, // Garante que preflight responde 200
  })
);

// Handler global para preflight OPTIONS (CORS)

const PORT = process.env.PORT || 9000;

// Middleware


// Webhook precisa receber raw body para validação de assinatura (se necessário)
app.use('/api/payments/webhooks', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'SORED API is running! 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: MySQL`);
  console.log(`🔐 JWT Authentication enabled`);
});

module.exports = app;
