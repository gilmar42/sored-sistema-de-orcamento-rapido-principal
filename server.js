require('dotenv').config({ path: require('path').resolve(__dirname, 'backend', '.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');

// Importa e inicializa imediatamente a API (Backend)
const app = require('./backend/src/app.cjs');

// Configura o servidor Express (que já está rodando a API) para TAMBÉM servir o Frontend

// O Output Directory definido para a Hostinger é a pasta 'dist' gerada pelo Vite dentro do frontend
const distPath = path.join(__dirname, 'frontend', 'dist');

// Serve os arquivos estáticos
app.use(express.static(distPath));

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

// NOTA: O arquivo backend/src/app.cjs já executa o app.listen(), 
// então ao chamar 'require' nele, o servidor já é colocado no ar.
console.log('✅ Server.js carregado: Unificando Backend e Frontend na mesma porta para deploy!');
