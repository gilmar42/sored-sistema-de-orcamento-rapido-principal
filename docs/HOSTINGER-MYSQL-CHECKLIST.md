# Checklist de MySQL e Hostinger

Use este checklist antes de subir o backend em produção.

## 1. Banco de Dados

- [ ] O MySQL do ambiente de produção está criado.
- [ ] O banco informado em `DB_NAME` existe de verdade.
- [ ] O usuário de `DB_USER` tem permissão nesse banco.
- [ ] A senha de `DB_PASSWORD` foi testada com sucesso.
- [ ] `DB_HOST` aponta para o host correto do MySQL.
- [ ] `DB_HOST` não inclui `:3306` no final.
- [ ] `DB_PORT` está definido como `3306` ou a porta real do servidor.

## 2. Hostinger

- [ ] O domínio está apontando para o projeto certo.
- [ ] O SSL está ativo no domínio público.
- [ ] O backend está publicado com `NODE_ENV=production`.
- [ ] O frontend público está em `FRONTEND_URL_PRODUCTION`.
- [ ] O backend consegue acessar o banco sem usar `127.0.0.1`.

## 3. Variáveis de Ambiente

- [ ] `JWT_SECRET` foi trocado por um segredo forte.
- [ ] `FRONTEND_URL` e `FRONTEND_URL_PRODUCTION` usam HTTPS.
- [ ] `MERCADO_PAGO_ACCESS_TOKEN` está em produção.
- [ ] `MERCADO_PAGO_PUBLIC_KEY` está em produção.
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET` está configurado.

## 4. Validação

- [ ] `npm run validate:production` passa.
- [ ] `/api/system-check` responde `UP`.
- [ ] Login funciona com usuário real.
- [ ] Signup cria conta nova sem `500`.
- [ ] O erro de banco, se acontecer, retorna `503`.

## 5. Se Algo Falhar

- [ ] Verifique os logs do backend.
- [ ] Confirme se o banco aceita conexões remotas.
- [ ] Confirme se o backend foi reiniciado após alterar `.env`.
- [ ] Confirme se o deploy pegou o commit mais recente.
