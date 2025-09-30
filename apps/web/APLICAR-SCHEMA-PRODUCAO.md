# Como Aplicar Schema Completo em Produção

## 🎯 Problema

O banco de dados de **produção (Railway)** está desatualizado:

### Local (19 tabelas) vs Produção (13 tabelas)

**❌ Faltam em Produção:**
- `Client` - Módulo CRM completo
- `Activity` - Audit trail
- `Label` + `CardLabel` - Sistema de tags
- `Attachment` - Upload de arquivos
- `ChecklistTemplate` - Templates reutilizáveis

**❌ Campos faltando:**
- `Card.order` - Ordenação persistente de cards

## ✅ Solução: Aplicar Schema via Railway CLI

### Opção 1: Via Railway CLI (Recomendado)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Linkar ao projeto
railway link

# 4. Aplicar schema ao banco de produção
railway run npx prisma db push

# OU aplicar migrations existentes
railway run npx prisma migrate deploy
```

### Opção 2: Via Dashboard Railway

1. Acesse: https://railway.app
2. Vá em: **NexmaTrello** → **nexlist-web**
3. Clique em: **Settings** → **Variables**
4. Adicione variável temporária:
   ```
   RUN_MIGRATION=true
   ```
5. Modifique o `package.json` para adicionar:
   ```json
   "scripts": {
     "start": "npm run migrate:prod && next start",
     "migrate:prod": "prisma db push --skip-generate"
   }
   ```
6. Faça commit e push
7. Railway vai rodar a migration no próximo deploy

### Opção 3: Criar Migration Manual

Se você tiver acesso ao banco de produção via SQL:

```sql
-- Adicionar campo Card.order
ALTER TABLE "Card" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Card_columnId_order_idx" ON "Card"("columnId", "order");

-- Criar tabela Client
CREATE TABLE "Client" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NORMAL',
  lead INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  email TEXT,
  document TEXT,
  sector TEXT,
  region TEXT,
  notes TEXT,
  "firstContact" TIMESTAMP(3),
  "lastContact" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Client_status_idx" ON "Client"(status);
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");
CREATE INDEX "Client_email_idx" ON "Client"(email);

-- Criar tabela Activity
CREATE TABLE "Activity" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "boardId" TEXT NOT NULL,
  "cardId" TEXT,
  "clientId" TEXT,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE,
  FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"(id)
);

CREATE INDEX "Activity_boardId_idx" ON "Activity"("boardId");
CREATE INDEX "Activity_cardId_idx" ON "Activity"("cardId");
CREATE INDEX "Activity_clientId_idx" ON "Activity"("clientId");
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX "Activity_type_idx" ON "Activity"(type);

-- Criar tabela Label
CREATE TABLE "Label" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "boardId" TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE,
  UNIQUE ("boardId", name)
);

CREATE INDEX "Label_boardId_idx" ON "Label"("boardId");

-- Criar tabela CardLabel
CREATE TABLE "CardLabel" (
  "cardId" TEXT NOT NULL,
  "labelId" TEXT NOT NULL,
  PRIMARY KEY ("cardId", "labelId"),
  FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE,
  FOREIGN KEY ("labelId") REFERENCES "Label"(id) ON DELETE CASCADE
);

CREATE INDEX "CardLabel_cardId_idx" ON "CardLabel"("cardId");
CREATE INDEX "CardLabel_labelId_idx" ON "CardLabel"("labelId");

-- Criar tabela Attachment
CREATE TABLE "Attachment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "cardId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE,
  FOREIGN KEY ("uploadedBy") REFERENCES "User"(id)
);

CREATE INDEX "Attachment_cardId_idx" ON "Attachment"("cardId");
CREATE INDEX "Attachment_uploadedBy_idx" ON "Attachment"("uploadedBy");

-- Criar tabela ChecklistTemplate
CREATE TABLE "ChecklistTemplate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "boardId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE
);

CREATE INDEX "ChecklistTemplate_boardId_idx" ON "ChecklistTemplate"("boardId");
```

## 📝 Depois de Aplicar

1. **Reverter commits que desabilitaram código:**
   ```bash
   git revert HEAD~2  # Reverte os 2 últimos commits
   # OU descomentar manualmente os arquivos marcados com TODO
   ```

2. **Descomentar código:**
   - `app/(protected)/board/[boardId]/page.tsx` - linha 46-53 (client)
   - `app/(protected)/clientes/page.tsx` - todo arquivo
   - `app/api/clients/route.ts` - todo arquivo
   - `app/api/clients/[clientId]/route.ts` - todo arquivo
   - `app/api/boards/[boardId]/cards/[cardId]/reorder/route.ts` - todo arquivo
   - `lib/activity.ts` - todas as funções

3. **Fazer novo build e deploy:**
   ```bash
   npm run build
   git add -A
   git commit -m "RESTORE: Reativar todas funcionalidades após sync do BD"
   git push origin main
   ```

## 🚀 Automatizar para Futuros Deploys

Adicione ao `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start"
  }
}
```

Isso garante que toda migration seja aplicada antes do build em produção.

---

**Conclusão:** Você estava **100% certo**! O correto é sincronizar o banco de produção, não desabilitar o código.
