# 🚀 SORED - Sistema de Orçamento Rápido

Sistema completo de gestão de orçamentos com cálculos automáticos, gestão de materiais, clientes e geração de PDF profissional.

## ✨ Funcionalidades

- 📊 **Calculadora de Orçamentos** - Cálculos automáticos baseados em componentes
- 🔧 **Gestão de Materiais** - Controle completo de materiais e componentes
- 👥 **Gestão de Clientes** - CRUD completo com busca e estatísticas
- 📄 **Geração de PDF** - Orçamentos profissionais em PDF
- 💾 **Persistência Automática** - Dados salvos automaticamente no navegador
- 🎨 **Tema Ice/Blue** - Interface moderna com cores profissionais
- 🌓 **Dark Mode** - Suporte a modo escuro
- 📱 **Responsivo** - Funciona em desktop, tablet e mobile

## 🛠️ Tecnologias

- **React 18.2.0** - Framework UI
- **TypeScript** - Type safety
- **Vite 5.4.21** - Build tool rápido
- **Tailwind CSS v4** - Estilização moderna
- **Jest + Testing Library** - Testes automatizados
- **jsPDF** - Geração de PDF

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/gilmar42/sord-sistema-de-or-amento-rapido-principal.git
   cd sored---sistema-de-orçamento-rápido
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador:
   ```
   http://localhost:5173
   ```

## 🧪 Testes

O projeto possui uma suíte completa de testes automatizados (86+ casos de teste).

### Executar todos os testes
```bash
npm test
```

### Executar apenas testes de produção
```bash
npm run test:production
```

### Validação completa para produção
```bash
npm run validate:production
```

📚 **Documentação Completa de Testes**: [TESTING.md](./TESTING.md)

## 📦 Build para Produção

```bash
npm run build
```

O build otimizado será gerado na pasta `dist/`.

## 📖 Documentação

- [TESTING.md](./TESTING.md) - Documentação completa dos testes
- [PRODUCTION-GUIDE.md](./PRODUCTION-GUIDE.md) - Guia rápido para produção
- [TESTS-SUMMARY.md](./TESTS-SUMMARY.md) - Resumo da implementação

## 🎯 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── QuoteCalculator.tsx
│   ├── MaterialManagement.tsx
│   ├── ClientManagement.tsx
│   └── __tests__/      # Testes dos componentes
├── context/            # Contextos React
│   ├── DataContext.tsx
│   ├── AuthContext.tsx
│   └── __tests__/      # Testes dos contextos
├── services/           # Serviços (PDF, etc)
├── utils/             # Utilitários
└── types.ts           # Definições TypeScript
```

## 🔐 Autenticação

O sistema usa autenticação simples com tenant isolation. Cada usuário tem seus dados isolados.

## 💡 Como Usar

1. **Criar Materiais**: Adicione materiais com componentes e custos
2. **Cadastrar Clientes**: Registre seus clientes
3. **Criar Orçamentos**: Selecione materiais, defina quantidades e margens
4. **Gerar PDF**: Exporte orçamentos profissionais em PDF

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Gilmar Dutra**
- GitHub: [@gilmar42](https://github.com/gilmar42)

## 🌟 Status do Projeto

✅ **Pronto para Produção**
- 86+ testes automatizados passando
- Build otimizado
- Documentação completa
- Interface moderna e responsiva

---

**Última Atualização**: 20 de Novembro de 2025
