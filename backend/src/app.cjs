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

// Configurações do Banco de Dados (Lazy loading)
const db = require('./config/database');
const { initDB } = require('./config/database_utils.cjs');
const { syncFromMySQL } = require('./services/authFallbackStore.cjs');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

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
];

const envOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL_PRODUCTION].filter(Boolean);
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

// Middleware CORS (dev + produção via env)
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

const cookieParser = require('cookie-parser');

// Middleware
app.use(cookieParser()); // Necessário para ler cookies de token
// Webhook precisa receber raw body para validação de assinatura (se necessário)
app.use('/api/payments/webhooks', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));
app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError ||
    error.type === 'entity.parse.failed' ||
    error.type === 'entity.unsupported' ||
    (error.status === 400 && 'body' in error)
  ) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  return next(error);
});

// Health check & Diagnostics
app.get('/api', (req, res) => {
  res.json({ message: 'SORED API is running! 🚀' });
});

// A rota /api/system-check foi movida para o server.js para evitar conflitos de rota.

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

async function startServer() {
  try {
    if (typeof initDB === 'function') {
      await initDB();
      if (!isProduction) {
        console.log('✅ Tabelas do Banco de Dados verificadas/criadas antes do boot.');
      }
    }

    // Sync users from MySQL to fallback store on startup (only if MySQL is available)
    try {
      // Test MySQL connection first
      await db.query('SELECT 1');
      console.log('✅ MySQL connection available, syncing users...');
      await syncFromMySQL(db);
    } catch (dbError) {
      console.log('ℹ️ MySQL not available, skipping sync:', dbError.message);
      // Don't fail startup if MySQL is not available
    }

  } catch (error) {
    console.error('⚠️ Inicialização automática do banco falhou.');
    console.error(error.message);
    if (isProduction) {
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    if (!isProduction) {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Database: MySQL`);
      console.log(`🔐 JWT Authentication enabled`);
    }
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
