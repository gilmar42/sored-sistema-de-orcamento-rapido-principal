const path = require('path');
const dotenv = require('dotenv');

// Carrega .env da Raiz ou da pasta Backend (para garantir que a senha seja lida)
dotenv.config(); // Primeiro tenta a raiz
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') }); // Depois tenta a pasta backend
const express = require('express');
const fs = require('fs');

// Importa e inicializa imediatamente a API (Backend)
const app = require('./backend/src/app.cjs');
const { initDB } = require('./backend/src/config/database_utils.cjs');
const isProduction = process.env.NODE_ENV === 'production';

// Verificação de Variáveis de Ambiente (Pre-flight)
function validateEnv() {
    const required = ['JWT_SECRET', 'DB_USER', 'DB_NAME', 'DB_HOST'];
    const missing = required.filter(key => !process.env[key]);
    
    console.log('--- SYSTEM PRE-FLIGHT CHECK ---');
    if (missing.length > 0) {
        console.warn(`⚠️ AVISO: Variáveis críticas ausentes: ${missing.join(', ')}`);
        console.warn('DICA: Verifique se o arquivo .env está no lugar correto ou se as variáveis foram setadas no hPanel.');
    }
    
    if (!process.env.DB_PASSWORD && !process.env.DB_PASS) {
        console.warn('⚠️ AVISO: DB_PASSWORD não detectado. A conexão MySQL provavelmente falhará.');
    }
    
    console.log('--- PRE-FLIGHT COMPLETE ---');
}

// Configura o servidor Express (que já está rodando a API) para TAMBÉM servir o Frontend

// O Output Directory definido para a Hostinger é a pasta 'dist' gerada pelo Vite dentro do frontend
const distPath = path.join(__dirname, 'frontend', 'dist');

// Serve os arquivos estáticos
app.use(express.static(distPath));

// Favicon explícito para evitar requisição ao /favicon.ico sem arquivo correspondente
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(distPath, 'favicon.svg');
    if (fs.existsSync(faviconPath)) {
        res.type('image/svg+xml');
        return res.sendFile(faviconPath);
    }
    return res.status(204).end();
});

// Rota de Check-in de Emergência (Para provar o Deploy)
app.get('/api/check-in', (req, res) => {
    res.json({
        status: 'DEPLOY_SUCCESS_V2',
        timestamp: new Date().toISOString(),
        cwd: process.cwd(),
        backend_env: process.env.NODE_ENV
    });
});

// Consigo checar o sistema inteiro aqui também
app.get('/api/system-check', async (req, res) => {
    try {
        const db = require('./backend/src/config/database');
        const [rows] = await db.query('SELECT 1 as alive');
        
        res.json({
            status: 'UP',
            database: '✅ CONECTADO',
            cwd: process.cwd(),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        let rootFiles = [];
        let backendFiles = [];
        try { rootFiles = fs.readdirSync(process.cwd()); } catch (e) {}
        try { backendFiles = fs.readdirSync(path.join(process.cwd(), 'backend')); } catch (e) {}

        res.status(500).json({
            status: 'DOWN',
            database: '❌ ERRO: ' + err.message,
            cwd: process.cwd(),
            root_files: rootFiles,
            backend_files: backendFiles,
            env_loaded: {
                DB_USER: process.env.DB_USER,
                ROOT_ENV: fs.existsSync(path.join(process.cwd(), '.env')),
                BACKEND_ENV: fs.existsSync(path.join(process.cwd(), 'backend', '.env')),
                AVAILABLE_KEYS: Object.keys(process.env).filter(key => key.startsWith('DB_') || key.startsWith('JWT_') || key.startsWith('MP_')),
                PASS_AUDIT: process.env.DB_PASSWORD || process.env.DB_PASS ? {
                    length: (process.env.DB_PASSWORD || process.env.DB_PASS).length,
                    first: (process.env.DB_PASSWORD || process.env.DB_PASS)[0],
                    last: (process.env.DB_PASSWORD || process.env.DB_PASS).slice(-1)
                } : 'MISSING'
            },
            hint: 'O banco REJEITOU a senha. Verifique se você incluiu espaços ou aspas (ex: "senha") no seu .env por engano.'
        });
    }
});

// Manda tudo que não for requisição da API para o Roteador do React (index.html)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Aguardando a Build do Frontend na pasta dist...');
    }
});

// Inicia o servidor unificado
const PORT = process.env.PORT || 9000;

async function startServer() {
    try {
        validateEnv();
        if (typeof initDB === 'function') {
            await initDB();
            if (!isProduction) {
                console.log('✅ Tabelas do Banco de Dados verificadas/criadas antes do boot.');
            }
        }
    } catch (e) {
        console.error('❌ ERRO CRÍTICO NA INICIALIZAÇÃO DO BANCO:');
        console.error(`> ${e.message}`);
        console.error('⚠️ O SISTEMA ENTRARÁ EM MODO DEGRADADO (USANDO APENAS FALLBACK AUTH).');
        console.error('⚠️ Resolva os problemas de conexão para restaurar a funcionalidade total.');
        
        // Em vez de process.exit(1), permitimos que o servidor suba para que o usuário possa acessar os logs
        // e possivelmente usar o sistema via fallback store se houver dados lá.
    }

    app.listen(PORT, () => {
        const url = isProduction ? 'Produção' : `http://localhost:${PORT}`;
        console.log(`🚀 Unified Server running on ${url}`);
        console.log(`✅ Status: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
        console.log(`✅ Frontend: ${distPath}`);
        console.log(`💡 DICA: Para persistir usuários em falhas de banco, não apague a pasta 'backend/data' durante o deploy.`);
    });
}

startServer();
