# 🚨 Como Restaurar o Banco de Dados - Guia Passo a Passo

**Situação**: Seu banco PostgreSQL de produção está vazio (sem tabelas)
**Solução**: Executar o script SQL completo de restauração
**Tempo estimado**: 2-5 minutos

---

## 📋 Pré-requisitos

- ✅ Acesso ao painel de administração do banco (Railway, Render, Supabase, etc.)
- ✅ Arquivo `RESTORE_DATABASE_COMPLETE.sql` (está na pasta `apps/web`)
- ⚠️ **ATENÇÃO**: Este script VAI APAGAR todos os dados existentes! Faça backup se necessário.

---

## 🎯 Passo a Passo

### 1️⃣ Acessar o Console SQL do Banco

**Se você está usando Railway:**
1. Acesse https://railway.app
2. Entre no projeto NexmaTrello
3. Clique no serviço **Postgres**
4. Vá na aba **"Data"** ou **"Query"**
5. Você verá um editor SQL

**Se você está usando Render:**
1. Acesse https://render.com
2. Entre no projeto NexmaTrello
3. Clique no banco **PostgreSQL**
4. Clique em **"Access"** → **"psql Console"**
5. Cole o SQL direto no terminal

**Se você está usando Supabase:**
1. Acesse https://supabase.com
2. Entre no projeto
3. Vá em **"SQL Editor"** na sidebar
4. Clique em **"New query"**

---

### 2️⃣ Copiar o SQL Completo

1. Abra o arquivo: `apps/web/RESTORE_DATABASE_COMPLETE.sql`
2. **Copie TODO o conteúdo** (Cmd+A depois Cmd+C no Mac, ou Ctrl+A e Ctrl+C no Windows)
3. O arquivo tem ~600 linhas - copie TUDO!

---

### 3️⃣ Executar o SQL

**Na interface web do banco:**
1. Cole o SQL no editor
2. Clique em **"Run"** ou **"Execute"**
3. Aguarde ~30-60 segundos

**Ou via linha de comando (se preferir):**
```bash
# Conectar ao banco
psql "postgresql://user:password@host:5432/database"

# Executar o arquivo
\i apps/web/RESTORE_DATABASE_COMPLETE.sql

# Ou executar diretamente
psql "postgresql://user:password@host:5432/database" < apps/web/RESTORE_DATABASE_COMPLETE.sql
```

---

### 4️⃣ Verificar se Deu Certo

Após executar, você deve ver:
```
Database restored successfully!
```

E a mensagem mostrará o número total de tabelas criadas (deve ser ~17-20).

**Verificação visual:**
- Volte para a aba **"Data"** ou **"Tables"**
- Você deve ver as tabelas: User, Board, Card, Checklist, Notification, etc.
- Clique em uma tabela (ex: User) - ela deve estar VAZIA mas existir

---

## ✅ O Que Foi Criado

O script criou:
- ✅ **8 ENUMs**: Role, Urgency, ClientStatus, OnboardStatus, InviteStatus, NotificationType, ActivityType
- ✅ **17 Tabelas**: User, Session, Board, BoardMember, Column, Card, Checklist, ChecklistItem, CardAssignee, Invite, Notification, Comment, Client, Label, CardLabel, Attachment, ChecklistTemplate, Activity
- ✅ **50+ Índices**: Incluindo os novos índices de performance
- ✅ **Todas as Foreign Keys**: Relações entre tabelas configuradas
- ✅ **Registro de Migrations**: Prisma reconhecerá que o banco está atualizado

---

## 🎉 Próximos Passos

### 1. Criar Usuários de Teste

Execute o script de seed:
```bash
cd apps/web
npm run seed:users-only
```

Isso criará:
- alice@nexma.com
- bob@nexma.com
- carol@nexma.com
- daniel@nexma.com
- carlos@nexma.com
- etc.

Senha de todos: `senha123`

---

### 2. Criar Board "Trello Geral Nexma"

```bash
npm run add:general
```

Isso adiciona todos os usuários ao board público.

---

### 3. Testar a Aplicação

```bash
npm run dev
```

Acesse http://localhost:3000 e:
1. Faça login com `alice@nexma.com` / `senha123`
2. Crie um board
3. Crie cards
4. Teste checklists

---

## 🔧 Solução de Problemas

### Erro: "type X already exists"
**Causa**: Você executou o script 2x ou tinha alguma coisa no banco.
**Solução**:
```sql
-- Apagar tudo e recomeçar
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Agora execute o script novamente
```

---

### Erro: "permission denied"
**Causa**: Usuário do banco não tem permissões de admin.
**Solução**: Use o usuário `postgres` ou owner do banco.

---

### Erro: "relation X does not exist" após executar
**Causa**: Script foi executado parcialmente.
**Solução**: Veja o log de erros, identifique onde parou, e execute a partir dali. Ou use o DROP SCHEMA acima e recomece.

---

### Banco continua vazio após executar
**Verificações**:
1. Você executou em qual banco? Verifique a DATABASE_URL
2. Você executou no banco certo? (Pode ter múltiplos bancos)
3. Houve algum erro no meio da execução?

---

## ⚠️ Dados Antigos Foram Perdidos?

Se você tinha dados antes e quer recuperar:

### Opção 1: Restaurar Backup
Se você fez backup antes (recomendado sempre):
```bash
# Railway
railway backup restore <backup-id>

# Render
# Vá em Backups → Restore

# Supabase
# Vá em Database → Backups → Restore
```

### Opção 2: Migration Normal (Se tinha dados importantes)
Se você NÃO quer perder dados e ainda tem um backup:
1. NÃO execute o `RESTORE_DATABASE_COMPLETE.sql`
2. Em vez disso, use:
```bash
npx prisma migrate deploy
```

Isso aplicará as migrations incrementais sem apagar dados.

---

## 📞 Precisa de Ajuda?

Se algo deu errado:
1. Copie a mensagem de erro COMPLETA
2. Tire screenshot da tela
3. Verifique qual linha do SQL falhou
4. Procure ajuda com essas informações

---

## 🎓 Entendendo o Que Aconteceu

Seu banco estava vazio por uma dessas razões:
1. ❌ Migrations do Prisma nunca foram aplicadas em produção
2. ❌ Banco foi resetado acidentalmente
3. ❌ Connection string estava apontando para banco errado
4. ❌ Algum script de limpeza rodou sem querer

**Prevenção futura**:
- ✅ Sempre use migrations do Prisma: `npx prisma migrate deploy`
- ✅ Configure backups automáticos na plataforma
- ✅ Teste localmente antes de aplicar em produção
- ✅ Use staging environment para testes

---

## 📊 Resumo do Que o Script Faz

```
1. Cria ENUMs (tipos customizados)
   ↓
2. Cria 17 tabelas principais
   ↓
3. Adiciona 50+ índices (incluindo novos de performance)
   ↓
4. Configura foreign keys (relações)
   ↓
5. Registra migrations no Prisma
   ↓
6. Retorna mensagem de sucesso
```

**Tamanho final do banco**: ~5-10 MB vazio, cresce conforme uso

---

**Versão**: 2.0 (Novembro 2025)
**Compatível com**: PostgreSQL 12+, Prisma 5.19+
**Inclui**: Todas as melhorias de segurança e performance implementadas
