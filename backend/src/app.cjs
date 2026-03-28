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
    origin: (origin, callback) => {
      // Permite qualquer localhost ou 127.0.0.1 em desenvolvimento, ou as origens permitidas
      const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
      if (!origin || isLocal || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('⚠️ CORS Blocked for origin:', origin);
        callback(null, false); // Não permitir, mas não lançar erro 500
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// CORS is handled by the middleware above



// Handler global para preflight OPTIONS (CORS)

const PORT = process.env.PORT || 9000;

// Middleware


// Webhook precisa receber raw body para validação de assinatura (se necessário)
app.use('/api/payments/webhooks', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));

// Health check & Diagnostics
app.get('/api', (req, res) => {
  res.json({ message: 'SORED API is running! 🚀' });
});

app.get('/api/system-check', async (req, res) => {
  try {
    const db = require('./config/database');
    const [rows] = await db.query('SELECT 1');
    const envAudit = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DB_HOST: process.env.DB_HOST ? '✅ Configurado' : '❌ FALTANDO',
      DB_USER: process.env.DB_USER || '❌ FALTANDO',
      DB_NAME: process.env.DB_NAME || '❌ FALTANDO',
      MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN ? '✅ Configurado (Comprimento: ' + process.env.MP_ACCESS_TOKEN.length + ')' : '❌ FALTANDO',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurado' : '❌ FALTANDO',
      PORT: process.env.PORT || '9000 (default)',
    };

    res.json({
      status: 'UP',
      database: '✅ CONECTADO',
      environment: envAudit,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'DOWN',
      database: '❌ ERRO DE CONEXÃO: ' + err.message,
      environment_keys_present: Object.keys(process.env).filter(k => k.includes('DB_') || k.includes('MP_') || k.includes('JWT')),
      error: err.stack
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentsRoutes);

// Error handler (Transparente para DEBUG na Hostinger)
app.use((err, req, res, next) => {
  console.error('❌ [SERVER ERROR]:', err.stack);
  res.status(500).json({ 
    error: 'Erro Interno do Servidor', 
    message: err.message,
    stack: err.stack,
    hint: 'Este erro detalhado só aparece no Modo de Depuração que ativamos agora.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Database: MySQL`);
    console.log(`🔐 JWT Authentication enabled`);
  });
}

module.exports = app;
