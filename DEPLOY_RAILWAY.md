# 🚂 Deploy no Railway - NexmaTrello

## 🎯 Passo a Passo Completo

### **Passo 1: Acessar Railway**

1. Acesse: https://railway.app
2. Clique em **Login** (use GitHub para login rápido)
3. Você será redirecionado para o dashboard

---

### **Passo 2: Criar Novo Projeto**

1. Clique em **+ New Project**
2. Selecione **Deploy from GitHub repo**
3. Se for a primeira vez, clique em **Configure GitHub App**
   - Autorize o Railway a acessar seus repositórios
   - Selecione **caue-mor** (sua conta)
4. Selecione o repositório: **caue-mor/NexmaTrello**
5. Clique em **Deploy Now**

⏳ **Aguarde...** O Railway vai começar a fazer o build do projeto.

**IMPORTANTE:** O deploy vai **FALHAR** na primeira vez porque falta o banco de dados! Isso é normal.

---

### **Passo 3: Adicionar PostgreSQL**

No mesmo projeto:

1. Clique em **+ New** (botão no canto superior direito)
2. Selecione **Database**
3. Escolha **Add PostgreSQL**
4. Clique em **Add PostgreSQL**

✅ O PostgreSQL foi criado!

**O Railway conecta automaticamente!** Ele cria uma variável `DATABASE_URL` no seu serviço Next.js.

---

### **Passo 4: Adicionar Redis**

1. Clique em **+ New** novamente
2. Selecione **Database**
3. Escolha **Add Redis**
4. Clique em **Add Redis**

✅ O Redis foi criado!

O Railway também conecta automaticamente com a variável `REDIS_URL`.

---

### **Passo 5: Configurar Variáveis de Ambiente**

1. Clique no serviço **web** (seu app Next.js)
2. Vá na aba **Variables**
3. Adicione as seguintes variáveis:

#### Variáveis necessárias:

```bash
# Gerado automaticamente pelo Railway:
DATABASE_URL = (já configurado pelo Railway)
REDIS_URL = (já configurado pelo Railway)

# Você precisa adicionar:
NEXTAUTH_SECRET = (gere com: openssl rand -base64 32)
NEXTAUTH_URL = https://SEU-APP.up.railway.app (Railway vai te dar essa URL)
```

#### Como gerar o NEXTAUTH_SECRET:

No terminal local, execute:
```bash
openssl rand -base64 32
```

Copie o resultado e cole na variável `NEXTAUTH_SECRET`.

#### Como saber a URL do Railway:

1. Vá na aba **Settings** do seu serviço web
2. Role até **Domains**
3. Clique em **Generate Domain**
4. Copie a URL gerada (ex: `nexmatrello-production-xxxx.up.railway.app`)
5. Cole em `NEXTAUTH_URL` com `https://` na frente

**Exemplo:**
```
NEXTAUTH_URL=https://nexmatrello-production-a1b2.up.railway.app
```

4. Clique em **Add** para cada variável

---

### **Passo 6: Configurar Root Directory**

⚠️ **IMPORTANTE:** O Railway precisa saber onde está o app Next.js!

1. No serviço **web**, vá em **Settings**
2. Role até **Build & Deploy**
3. Em **Root Directory**, coloque: `apps/web`
4. Em **Watch Paths**, adicione: `apps/web/**`
5. Clique em **Save Changes**

---

### **Passo 7: Rodar Migrations**

Você precisa rodar as migrations do Prisma no banco de dados.

#### Opção A: Via Railway CLI (Recomendado)

1. Instale o Railway CLI:
```bash
npm install -g @railway/cli
```

2. Faça login:
```bash
railway login
```

3. Conecte ao projeto:
```bash
cd /Users/steveherison/Documents/TrelloNexma/apps/web
railway link
# Selecione seu projeto NexmaTrello
```

4. Rode as migrations:
```bash
railway run npx prisma migrate deploy
```

5. (Opcional) Popule o banco com dados de teste:
```bash
railway run npx prisma db seed
```

#### Opção B: Via Terminal Local

1. Pegue a DATABASE_URL do Railway:
   - No serviço PostgreSQL, vá em **Connect**
   - Copie a **Postgres Connection URL**

2. No terminal:
```bash
cd /Users/steveherison/Documents/TrelloNexma/apps/web

# Exporte a DATABASE_URL
export DATABASE_URL="postgresql://postgres:password@host:port/railway"

# Rode migrations
npx prisma migrate deploy

# (Opcional) Seed
npx prisma db seed
```

---

### **Passo 8: Fazer Redeploy**

Agora que tudo está configurado:

1. Vá no serviço **web**
2. Clique nos **3 pontinhos** no canto superior direito
3. Clique em **Redeploy**

Ou simplesmente faça um push no GitHub:
```bash
git add .
git commit -m "Configure Railway"
git push origin main
```

O Railway detecta automaticamente e faz o deploy! 🚀

---

### **Passo 9: Verificar Deploy**

1. Aguarde o build terminar (pode levar 2-5 minutos)
2. Vá em **Deployments** para ver o progresso
3. Quando aparecer **SUCCESS**, clique na URL do domínio
4. Teste o app:
   - ✅ Registrar usuário
   - ✅ Fazer login
   - ✅ Criar board
   - ✅ Criar card

---

## 🎨 Configurações Opcionais

### Domínio Personalizado

1. No serviço web, vá em **Settings** → **Domains**
2. Clique em **Custom Domain**
3. Digite seu domínio (ex: `nexmatrello.com`)
4. Configure os DNS conforme instruções

### Pusher (Notificações Real-time)

Se quiser notificações em tempo real:

1. Acesse: https://pusher.com
2. Crie conta gratuita
3. Create App → Nome: `nexmatrello`
4. Na aba **App Keys**, copie:
   - `app_id`
   - `key`
   - `secret`
   - `cluster`
5. No Railway, adicione as variáveis:
```bash
PUSHER_APP_ID=seu_app_id
PUSHER_KEY=sua_key
PUSHER_SECRET=seu_secret
PUSHER_CLUSTER=seu_cluster
```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real:

1. No serviço web, clique em **Deployments**
2. Clique no deployment ativo
3. Veja os logs em tempo real

### Via CLI:
```bash
railway logs
```

### Métricas:

1. Vá em **Metrics** (no serviço)
2. Veja CPU, Memória, Bandwidth

---

## 🔄 Próximos Deploys

Sempre que fizer mudanças:

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

🎉 **Deploy automático no Railway!**

---

## 💰 Custos (Railway)

- **$5/mês gratuitos** para começar
- Depois:
  - **$0.000231/GB-hour** (memória)
  - **$0.000463/vCPU-hour** (CPU)
  - **$0.10/GB** (bandwidth)

**Estimativa para app pequeno/médio:**
- ~$5-10/mês com uso moderado
- PostgreSQL e Redis inclusos!

---

## 🐛 Troubleshooting

### Build falha com "Cannot find module"
**Solução:** Verifique se `Root Directory = apps/web` está configurado

### Erro: "DATABASE_URL is not defined"
**Solução:**
1. Verifique se PostgreSQL está adicionado
2. Clique em **Variables** e confirme que `DATABASE_URL` existe
3. Faça redeploy

### Erro: "Prisma Client not generated"
**Solução:** Adicione no `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Página em branco
**Solução:**
1. Veja os logs: Railway → Deployments → Click no deploy
2. Procure por erros
3. Verifique se todas as variáveis estão configuradas

### NEXTAUTH_URL incorreta
**Solução:**
1. Vá em Settings → Domains
2. Copie a URL correta
3. Atualize `NEXTAUTH_URL` em Variables
4. Redeploy

---

## 🔗 Links Úteis

- **Dashboard Railway:** https://railway.app/dashboard
- **Docs Railway:** https://docs.railway.app
- **Docs Next.js:** https://nextjs.org/docs
- **Docs Prisma:** https://www.prisma.io/docs

---

## 🎉 Resultado Final

Seu app estará disponível em:
```
https://nexmatrello-production-xxxx.up.railway.app
```

Com:
- ✅ Frontend + Backend (Next.js)
- ✅ PostgreSQL
- ✅ Redis
- ✅ Deploy automático via GitHub
- ✅ Logs e monitoring
- ✅ Escalável

**Pronto para produção!** 🚀

---

**Criado com Claude Code** 🤖