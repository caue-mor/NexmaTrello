# 🚀 Guia: Criar "Trello Geral Nexma" em Produção

## O que é o "Trello Geral Nexma"?

É um **board compartilhado** (`isOrgWide: true`) que:
- ✅ Aparece automaticamente para TODOS os usuários
- ✅ Serve como central de anúncios da empresa
- ✅ Contém card de boas-vindas explicando o sistema
- ✅ Não pode ser excluído por membros (apenas pelo owner)

---

## 📋 Passo a Passo para Produção

### 1️⃣ Acessar o PostgreSQL do Railway

**Opção A: Via Railway CLI**
```bash
railway login
railway link
railway connect postgres
```

**Opção B: Via Cliente SQL (Recomendado)**
1. Acesse o [Railway Dashboard](https://railway.app)
2. Abra seu projeto
3. Clique no serviço **PostgreSQL**
4. Na aba **Data**, clique em **Query**
5. Ou copie as credenciais e use um cliente como:
   - [TablePlus](https://tableplus.com/)
   - [DBeaver](https://dbeaver.io/)
   - [pgAdmin](https://www.pgadmin.org/)

---

### 2️⃣ Descobrir o ID do Usuário Admin

Execute no PostgreSQL do Railway:

```sql
SELECT id, name, email FROM "User" ORDER BY "createdAt" LIMIT 5;
```

**Resultado esperado:**
```
id                                  | name  | email
------------------------------------|-------|------------------
clx1abc2def3ghi4jkl5mnop6qrs7tuv8 | Steve | steve@nexma.com
```

✏️ **COPIE O ID** do usuário que será dono do board (geralmente o primeiro admin).

---

### 3️⃣ Executar os Comandos SQL

#### **Comando 1: Criar o Board**

```sql
INSERT INTO "Board" (id, title, "isOrgWide", "ownerId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Trello Geral Nexma',
  true,
  'SEU_USER_ID_AQUI', -- ⚠️ SUBSTITUA pelo ID copiado no passo 2
  NOW(),
  NOW()
)
RETURNING id;
```

**Resultado esperado:**
```
id
------------------------------------
clx9xyz1abc2def3ghi4jkl5mnop6qrs7t
```

✏️ **COPIE O ID DO BOARD** retornado.

---

#### **Comando 2: Criar as Colunas**

```sql
INSERT INTO "Column" (id, "boardId", title, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BOARD_ID_AQUI', '📢 Anúncios Gerais', 0, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '🎨 Design', 1, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '💻 Desenvolvimento', 2, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '📱 Marketing', 3, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '🎯 Metas', 4, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '📋 Processos', 5, NOW(), NOW()),
  (gen_random_uuid(), 'BOARD_ID_AQUI', '✅ Finalizado', 6, NOW(), NOW())
RETURNING id, title;
```

⚠️ **SUBSTITUA `BOARD_ID_AQUI`** pelo ID do passo anterior.

**Resultado esperado:**
```
id                                  | title
------------------------------------|-------------------
clx9col1abc2def3ghi4jkl5mnop6qrs7t | 📢 Anúncios Gerais
clx9col2abc2def3ghi4jkl5mnop6qrs7t | 🎨 Design
...
```

✏️ **COPIE O ID DA COLUNA "📢 Anúncios Gerais"** (primeira linha).

---

#### **Comando 3: Criar o Card de Boas-Vindas**

```sql
INSERT INTO "Card" (
  id,
  "boardId",
  "columnId",
  title,
  description,
  urgency,
  "createdById",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'BOARD_ID_AQUI', -- ⚠️ ID do board (passo 1)
  'COLUMN_ID_AQUI', -- ⚠️ ID da coluna "Anúncios Gerais" (passo 2)
  '🎉 Bem-vindo ao Trello Geral da Nexma!',
  E'Este é o espaço compartilhado de toda a empresa. 📋 Como usar:\n\n- Use as colunas para organizar anúncios e tarefas gerais\n- Todos os membros da empresa podem ver este board\n- Crie cards para comunicar novidades\n- Utilize as checklists para acompanhar progresso\n- Atribua pessoas aos cards quando necessário\n\n💡 Dica: Boards privados podem ser criados pelo botão "+ Criar Board" no dashboard!',
  'MEDIUM',
  'SEU_USER_ID_AQUI', -- ⚠️ ID do usuário admin (passo 1)
  NOW(),
  NOW()
);
```

---

### 4️⃣ Verificar se Funcionou

Execute para confirmar:

```sql
-- Ver o board criado
SELECT id, title, "isOrgWide", "ownerId"
FROM "Board"
WHERE title = 'Trello Geral Nexma';

-- Ver as colunas
SELECT c.id, c.title, c."order"
FROM "Column" c
JOIN "Board" b ON c."boardId" = b.id
WHERE b.title = 'Trello Geral Nexma'
ORDER BY c."order";

-- Ver o card de boas-vindas
SELECT ca.id, ca.title, co.title as coluna
FROM "Card" ca
JOIN "Column" co ON ca."columnId" = co.id
JOIN "Board" b ON ca."boardId" = b.id
WHERE b.title = 'Trello Geral Nexma';
```

**Resultado esperado:**
- 1 board encontrado ✅
- 7 colunas encontradas ✅
- 1 card encontrado ✅

---

### 5️⃣ Testar na Aplicação

1. Acesse a URL de produção do Railway
2. Faça login com qualquer usuário
3. No dashboard, você deve ver o board **"Trello Geral Nexma"**
4. Clique para abrir e verificar as colunas e o card de boas-vindas

---

## 🔧 Alternativa: Script Automatizado (Node.js)

Se preferir executar via código ao invés de SQL manual, posso criar um script Node.js que faz tudo automaticamente. Esse script:

1. Se conecta ao banco via `DATABASE_URL`
2. Verifica se o board já existe
3. Cria board + colunas + card automaticamente
4. Exibe log detalhado

**Quer que eu crie esse script?** Basta pedir!

---

## ❓ Perguntas Frequentes

### 1. E se eu quiser remover o board depois?

```sql
DELETE FROM "Board" WHERE title = 'Trello Geral Nexma';
```

(O cascade vai deletar colunas e cards automaticamente)

### 2. Posso mudar o dono do board depois?

```sql
UPDATE "Board"
SET "ownerId" = 'NOVO_USER_ID'
WHERE title = 'Trello Geral Nexma';
```

### 3. Como adicionar mais cards de exemplo?

Use o mesmo `INSERT INTO "Card"` do passo 3, mudando o `columnId` para a coluna desejada.

### 4. O board vai aparecer para novos usuários que se cadastrarem?

✅ **SIM!** Como `isOrgWide: true`, qualquer novo usuário verá automaticamente.

### 5. Posso ter múltiplos boards org-wide?

✅ **SIM!** Basta criar mais boards com `isOrgWide: true`.

---

## 🎯 Próximos Passos (Opcional)

- [ ] Criar mais cards de exemplo em cada coluna
- [ ] Adicionar checklists aos cards
- [ ] Criar boards org-wide por departamento (RH, Vendas, etc)
- [ ] Configurar notificações automáticas para novos anúncios

---

**Dúvidas?** Qualquer erro, me chame! 🚀