# 🎯 Guia de Integração Backend + Frontend

## 📦 Instalação das Dependências

```bash
# Instalar dependências do backend
npm install bcryptjs jsonwebtoken cors better-sqlite3 dotenv concurrently

# Instalar tipos (devDependencies)
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cors @types/better-sqlite3
```

## 🚀 Como Executar

### Modo 1: Frontend + Backend juntos (Recomendado)
```bash
npm run dev:full
```

### Modo 2: Separado

Terminal 1 - Backend:
```bash
npm run backend
```

Terminal 2 - Frontend:
```bash
npm run dev
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

**Backend** (`backend/.env`):
```env
JWT_SECRET=your-super-secret-key-change-this-in-production-12345
PORT=5000
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Estrutura do Backend

```
backend/
├── src/
│   ├── app.js              # Servidor Express principal
│   ├── config/
│   │   └── database.js     # Configuração SQLite
│   ├── middleware/
│   │   └── auth.js         # Middleware JWT
│   └── routes/
│       ├── auth.js         # Login/Signup
│       ├── materials.js    # CRUD Materials
│       ├── quotes.js       # CRUD Quotes
│       ├── clients.js      # CRUD Clients
│       ├── categories.js   # CRUD Categories
│       └── settings.js     # Settings
└── data/
    └── sored.db           # SQLite database (criado automaticamente)
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/signup` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Materials
- `GET /api/materials` - Listar todos
- `POST /api/materials` - Criar
- `PUT /api/materials/:id` - Atualizar
- `DELETE /api/materials/:id` - Deletar

### Quotes
- `GET /api/quotes` - Listar todos
- `POST /api/quotes` - Criar
- `PUT /api/quotes/:id` - Atualizar
- `DELETE /api/quotes/:id` - Deletar

### Clients
- `GET /api/clients` - Listar todos
- `POST /api/clients` - Criar
- `PUT /api/clients/:id` - Atualizar
- `DELETE /api/clients/:id` - Deletar

### Categories
- `GET /api/categories` - Listar todas
- `POST /api/categories` - Criar
- `PUT /api/categories/:id` - Atualizar
- `DELETE /api/categories/:id` - Deletar

### Settings
- `GET /api/settings` - Obter configurações
- `PUT /api/settings` - Atualizar configurações

## 🔐 Autenticação JWT

Todas as rotas (exceto `/api/auth/*`) requerem token JWT no header:

```typescript
headers: {
  'Authorization': 'Bearer <token>'
}
```

## 🔄 Fluxo de Autenticação

1. **Signup/Login** → Recebe token JWT
2. Token salvo em `localStorage` ('auth_token')
3. Frontend envia token em todas as requisições
4. Backend valida token e extrai `tenantId`
5. Dados filtrados por `tenantId` automaticamente

## 📊 Banco de Dados

**SQLite** com as seguintes tabelas:
- `tenants` - Empresas/organizações
- `users` - Usuários autenticados
- `materials` - Materiais
- `quotes` - Orçamentos
- `clients` - Clientes
- `categories` - Categorias
- `settings` - Configurações da empresa

**Multi-tenant**: Cada empresa tem seus próprios dados isolados por `tenant_id`.

## 🎨 Migração de LocalStorage → API

O AuthContext já foi atualizado para usar a API. O DataContext ainda usa localStorage como fallback, mas você pode atualizar para usar a API seguindo o padrão do AuthContext.

## ⚡ Performance

- **Caching**: Frontend mantém dados em memória (React state)
- **Lazy Loading**: Dados carregados apenas quando necessário
- **Debouncing**: Evita múltiplas requisições simultâneas

## 🔒 Segurança

✅ Senhas criptografadas com bcrypt
✅ JWT com expiração (7 dias)
✅ CORS configurado
✅ SQL Injection protection (prepared statements)
✅ Multi-tenant isolation
✅ Token validation middleware

## 🐛 Debugging

### Ver logs do backend:
```bash
npm run backend
```

### Testar endpoints manualmente:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Listar materials (com token)
curl http://localhost:5000/api/materials \
  -H "Authorization: Bearer <seu-token-aqui>"
```

## 📝 Próximos Passos

1. ✅ Backend API REST implementado
2. ✅ Autenticação JWT funcionando
3. ✅ Integração no AuthContext
4. ⏳ Atualizar DataContext para usar API
5. ⏳ Testar fluxo completo
6. ⏳ Deploy (Heroku, Railway, DigitalOcean)

## 🚀 Deploy para Produção

### Backend:
- Railway / Render / Heroku
- Mudar `JWT_SECRET` para valor seguro
- Configurar `NODE_ENV=production`
- Usar PostgreSQL ou MySQL (opcional)

### Frontend:
- Vercel / Netlify
- Atualizar `VITE_API_URL` para URL do backend em produção

---

**Feito! Backend completo com autenticação JWT, banco de dados SQLite e rotas CRUD integradas! 🎉**
