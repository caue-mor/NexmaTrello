# 🚀 Guia de Deploy - NexmaTrello

## Pré-requisitos
- ✅ Vercel CLI instalado
- ✅ Conta no GitHub (já tem)
- ✅ Repositório no GitHub (já tem)

## Passo 1: Criar Banco de Dados PostgreSQL (Neon)

1. Acesse: https://neon.tech
2. Clique em **Sign Up** (pode usar GitHub para login rápido)
3. Clique em **Create a project**
4. Configure:
   - Name: `nexmatrello`
   - Region: **US East (Ohio)** (mais próximo)
   - PostgreSQL Version: 16 (padrão)
5. Clique em **Create Project**
6. Na dashboard, clique em **Connection String**
7. **COPIE** a string que começa com `postgresql://...`
8. **SALVE** em um arquivo temporário - você vai precisar!

**Formato da URL:**
```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

---

## Passo 2: Criar Redis (Upstash)

1. Acesse: https://upstash.com
2. Clique em **Sign Up** (pode usar GitHub)
3. Clique em **Create Database**
4. Configure:
   - Name: `nexmatrello-redis`
   - Type: **Regional**
   - Region: **US-East-1** (Virginia)
   - TLS: **Enabled** (padrão)
5. Clique em **Create**
6. Na aba **Details**, role até **REST API**
7. **COPIE** a URL que aparece em **UPSTASH_REDIS_REST_URL**
8. **SALVE** junto com o DATABASE_URL!

**Formato da URL:**
```
https://touching-sunfish-12345.upstash.io
```

---

## Passo 3: Gerar Secret para Autenticação

No terminal, execute:
```bash
openssl rand -base64 32
```

**COPIE** o resultado e **SALVE** - será o NEXTAUTH_SECRET!

Exemplo de output:
```
K8yJ9mN4pQ6rS2tU5vW8xZ1aC3dE6fG9
```

---

## Passo 4: Deploy na Vercel

### 4.1 Login
```bash
cd /Users/steveherison/Documents/TrelloNexma/apps/web
vercel login
```
- Vai abrir o navegador
- Faça login com GitHub ou email
- Autorize o acesso

### 4.2 Primeiro Deploy
```bash
vercel
```

**Responda as perguntas:**
- `Set up and deploy "~/Documents/TrelloNexma/apps/web"?` → **Y** (Yes)
- `Which scope do you want to deploy to?` → Selecione **sua conta pessoal**
- `Link to existing project?` → **N** (No)
- `What's your project's name?` → **nexmatrello** (ou o nome que quiser)
- `In which directory is your code located?` → **./** (apenas pressione Enter)

A Vercel vai detectar automaticamente que é Next.js!

**Aguarde o deploy terminar...**

Quando terminar, você verá:
```
✅ Production: https://nexmatrello-xxx.vercel.app
```

**COPIE essa URL!**

---

## Passo 5: Configurar Variáveis de Ambiente

### Via Dashboard (Recomendado):

1. Acesse: https://vercel.com
2. Vá em **Projects**
3. Clique no projeto **nexmatrello**
4. Clique em **Settings** (no topo)
5. Clique em **Environment Variables** (menu lateral)
6. Adicione cada variável clicando em **Add New**:

#### Variáveis necessárias:

| Key | Value | Environments |
|-----|-------|--------------|
| `DATABASE_URL` | `postgresql://...` (do Neon) | Production, Preview, Development |
| `REDIS_URL` | `https://...upstash.io` (do Upstash) | Production, Preview, Development |
| `NEXTAUTH_SECRET` | (string gerada com openssl) | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://nexmatrello-xxx.vercel.app` (URL da Vercel) | Production |

**⚠️ IMPORTANTE:** Marque as 3 checkboxes (Production, Preview, Development) para cada variável!

### Via CLI (Alternativa):

```bash
# Adicionar variáveis
vercel env add DATABASE_URL production
# Cole o valor do Neon quando pedir

vercel env add REDIS_URL production
# Cole o valor do Upstash quando pedir

vercel env add NEXTAUTH_SECRET production
# Cole o secret gerado quando pedir

vercel env add NEXTAUTH_URL production
# Cole a URL da Vercel quando pedir
```

---

## Passo 6: Rodar Migrations do Prisma

Você precisa rodar as migrations no banco de dados Neon:

```bash
cd /Users/steveherison/Documents/TrelloNexma/apps/web

# Exportar DATABASE_URL localmente
export DATABASE_URL="postgresql://..." # Cole sua URL do Neon aqui

# Rodar migrations
npx prisma migrate deploy

# (Opcional) Popular com dados de teste
npx prisma db seed
```

---

## Passo 7: Fazer Deploy em Produção

Agora que as variáveis estão configuradas:

```bash
vercel --prod
```

Aguarde finalizar...

**🎉 PRONTO!** Seu app está no ar em:
```
https://nexmatrello-xxx.vercel.app
```

---

## 🔍 Verificar Deploy

1. Abra a URL no navegador
2. Deve aparecer a tela de login
3. Tente registrar um usuário novo
4. Faça login
5. Teste criar um board

---

## ⚙️ Configurações Opcionais

### Domínio Personalizado
1. Vá em **Settings** → **Domains**
2. Adicione seu domínio (ex: `nexmatrello.com`)
3. Configure os DNS conforme instruções

### Pusher (Real-time - Opcional)
Se quiser notificações em tempo real:

1. Acesse: https://pusher.com
2. Crie conta gratuita
3. Create App → Nome: `nexmatrello`
4. Copie as credenciais:
   - `PUSHER_APP_ID`
   - `PUSHER_KEY`
   - `PUSHER_SECRET`
   - `PUSHER_CLUSTER`
5. Adicione na Vercel (Environment Variables)

---

## 🐛 Troubleshooting

### Erro: "Database connection failed"
- ✅ Verifique se DATABASE_URL está correta
- ✅ Execute `npx prisma migrate deploy`
- ✅ Verifique se o Neon permite conexões externas

### Erro: "Redis connection failed"
- ✅ Verifique se REDIS_URL está correta
- ✅ Verifique se inclui `https://`

### Erro: "NEXTAUTH_URL is not set"
- ✅ Adicione a variável com a URL da Vercel
- ✅ Faça novo deploy

### Página em branco
- ✅ Veja os logs: `vercel logs`
- ✅ Verifique o console do navegador (F12)

---

## 📊 Monitoramento

### Ver logs em tempo real:
```bash
vercel logs --follow
```

### Ver analytics:
https://vercel.com/seu-usuario/nexmatrello/analytics

---

## 🔄 Próximos Deploys

Sempre que fizer mudanças no código:

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main

# Deploy automático na Vercel! 🎉
```

A Vercel detecta automaticamente o push no GitHub e faz deploy!

---

## 📞 Suporte

Problemas? Verifique:
- Logs da Vercel: https://vercel.com/seu-usuario/nexmatrello/logs
- Documentação Vercel: https://vercel.com/docs
- Documentação Neon: https://neon.tech/docs
- Documentação Upstash: https://docs.upstash.com

---

**Criado com Claude Code** 🤖