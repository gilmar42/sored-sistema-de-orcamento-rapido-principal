const path = require('path');
const dotenv = require('dotenv');

// Carrega .env da Raiz ou da pasta Backend (para garantir que a senha seja lida)
dotenv.config(); // Primeiro tenta a raiz
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') }); // Depois tenta a pasta backend
const express = require('express');
const fs = require('fs');

// Importa e inicializa imediatamente a API (Backend)
const app = require('./backend/src/app.cjs');

// Configura o servidor Express (que já está rodando a API) para TAMBÉM servir o Frontend

// O Output Directory definido para a Hostinger é a pasta 'dist' gerada pelo Vite dentro do frontend
const distPath = path.join(__dirname, 'frontend', 'dist');

// Serve os arquivos estáticos
app.use(express.static(distPath));

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
app.listen(PORT, async () => {
    console.log(`🚀 Unified Server running on http://localhost:${PORT}`);
    console.log(`✅ Server.js carregado: Unificando Backend e Frontend na mesma porta para deploy!`);

    // Tenta inicializar o banco de dados (sem travar o servidor)
    try {
        const db = require('./backend/src/config/database');
        // Chamamos a inicialização que criará as tabelas se não existirem
        const { initDB } = require('./backend/src/config/database_utils.cjs'); // Verifiquei que este arquivo existe
        if (typeof initDB === 'function') {
            await initDB();
            console.log('✅ Tabelas do Banco de Dados verificadas/criadas.');
        }
    } catch (e) {
        console.error('⚠️ Aviso: Inicialização automática do banco falhou. Use /api/system-check para diagnosticar.');
        console.error(e.message);
    }
});
