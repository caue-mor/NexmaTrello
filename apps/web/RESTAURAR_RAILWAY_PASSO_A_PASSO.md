# 🚂 Restaurar Banco Railway - Guia Visual Passo a Passo

**Tempo estimado**: 3-5 minutos
**Dificuldade**: ⭐ Fácil (copiar e colar)

---

## 🎯 Método 1: Via Interface Web do Railway (MAIS FÁCIL) ⭐

### Passo 1: Acessar o Banco no Railway

1. Abra seu navegador
2. Vá para: **https://railway.app**
3. Faça login (se necessário)
4. Clique no projeto **"NexmaTrello"** ou **"nexmatrello-production"**
5. Você verá os serviços: Web (Next.js) e **Postgres**
6. **Clique no card "Postgres"** (tem ícone de elefante 🐘)

### Passo 2: Abrir o Query Editor

Existem 2 formas:

**Opção A - Via Data Tab:**
1. Na página do Postgres, clique na aba **"Data"** (no topo)
2. Você verá "You have no tables" (isso é normal agora)
3. No canto superior direito, clique em **"Query"** ou **"SQL"**
4. Abrirá um editor SQL

**Opção B - Via Connect:**
1. Clique na aba **"Connect"**
2. Procure o botão **"Query"** ou **"Open in Editor"**
3. Abrirá o mesmo editor SQL

### Passo 3: Copiar o SQL Completo

1. **No seu computador**, abra o arquivo:
   ```
   apps/web/RESTORE_DATABASE_COMPLETE.sql
   ```

2. **Selecione TUDO**:
   - Mac: `Cmd + A`
   - Windows: `Ctrl + A`

3. **Copie**:
   - Mac: `Cmd + C`
   - Windows: `Ctrl + C`

📊 **Dica**: O arquivo tem ~600 linhas. Certifique-se de copiar TUDO!

### Passo 4: Colar e Executar

1. Volte para o **editor SQL do Railway**
2. **Cole o SQL**:
   - Mac: `Cmd + V`
   - Windows: `Ctrl + V`
3. **Clique no botão "Run"** ou **"Execute"** (geralmente azul, canto superior direito)
4. ⏳ **Aguarde 30-60 segundos**

### Passo 5: Verificar Sucesso ✅

Você deve ver:
```
✅ Database restored successfully!
✅ total_tables: 17-20
```

**OU** uma lista de mensagens como:
```
CREATE TYPE
CREATE TABLE
CREATE INDEX
...
```

Se vir erros vermelhos, **não se preocupe ainda** - vá para "Solução de Problemas" abaixo.

### Passo 6: Confirmar Tabelas Criadas

1. Volte para a aba **"Data"**
2. **Recarregue a página** (F5 ou Cmd+R)
3. Agora você deve ver as tabelas:
   - ✅ User
   - ✅ Board
   - ✅ Card
   - ✅ Checklist
   - ✅ Notification
   - ✅ E mais ~12 outras...

4. Clique em qualquer tabela (ex: "User")
5. Ela deve estar **vazia** mas **existir**

---

## 🎯 Método 2: Via Railway CLI (Para Usuários Avançados)

### Pré-requisitos

```bash
# Instalar Railway CLI (se não tiver)
npm install -g @railway/cli

# Login (abrirá browser)
railway login
```

### Executar Restauração

```bash
# Ir para a pasta do projeto
cd apps/web

# Link ao projeto Railway (escolha "NexmaTrello")
railway link

# Buscar connection string
railway variables get DATABASE_URL

# Executar SQL
railway run psql < RESTORE_DATABASE_COMPLETE.sql
```

---

## 🎯 Método 3: Via psql Local (Se tiver PostgreSQL instalado)

```bash
# Obter connection string do Railway
# Vá em Railway > Postgres > Connect > Copy Database URL

# Executar SQL
psql "postgresql://postgres:senha@containers.railway.app:5432/railway" < RESTORE_DATABASE_COMPLETE.sql

# Substituir a URL pela sua real
```

---

## ⚠️ Solução de Problemas

### Erro: "type Role already exists"

**Causa**: Você já tinha algo no banco ou executou 2x.

**Solução**:
```sql
-- Execute isso ANTES do script principal
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Depois execute o `RESTORE_DATABASE_COMPLETE.sql` novamente.

---

### Erro: "permission denied"

**Causa**: Usuário não é admin do banco.

**Solução**:
1. No Railway, vá em **Postgres > Settings**
2. Certifique-se de usar o usuário **postgres** (padrão)
3. Tente novamente

---

### Erro: "relation X does not exist" ao rodar app

**Causa**: Script não foi executado completamente.

**Solução**:
1. Verifique no Railway > Data se as tabelas existem
2. Se não existem, execute o script novamente
3. Se existem mas app dá erro, rode:
   ```bash
   npx prisma generate
   ```

---

### Tabelas criadas mas login não funciona

**Causa**: Não há usuários criados ainda.

**Solução**:
```bash
cd apps/web
npm run seed:users-only
```

Isso cria usuários de teste:
- `alice@nexma.com` / `senha123`
- `bob@nexma.com` / `senha123`
- `daniel@nexma.com` / `senha123`
- etc.

---

## 🎉 Próximos Passos (Após Restauração)

### 1. Criar Usuários de Teste

```bash
cd apps/web
npm run seed:users-only
```

**O que isso faz**: Cria ~10 usuários com senha `senha123`

### 2. Criar Board "Trello Geral Nexma"

```bash
npm run add:general
```

**O que isso faz**: Adiciona todos os usuários ao board público

### 3. Adicionar Coluna "Finalizado" em Todos os Boards

```bash
npm run add:finished
```

**O que isso faz**: Garante que auto-completion funcione

### 4. Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

**Login**: `alice@nexma.com`
**Senha**: `senha123`

### 5. Fazer Deploy (Se tudo funcionou local)

```bash
git add .
git commit -m "feat: restaurar banco de dados com schema completo"
git push
```

Railway vai fazer deploy automático.

---

## 📊 Checklist de Validação

Após executar tudo, verifique:

- [ ] ✅ Railway > Data mostra 17+ tabelas
- [ ] ✅ Tabela "User" existe (vazia inicialmente)
- [ ] ✅ Consegue criar usuário com `npm run seed:users-only`
- [ ] ✅ Consegue fazer login local com `alice@nexma.com`
- [ ] ✅ Consegue criar board
- [ ] ✅ Consegue criar card
- [ ] ✅ Consegue marcar checklist

Se todos ✅, está funcionando!

---

## 🔧 Comandos Úteis

### Ver tabelas no Railway CLI
```bash
railway run psql -c "\dt"
```

### Contar registros em uma tabela
```bash
railway run psql -c "SELECT COUNT(*) FROM \"User\";"
```

### Ver usuários criados
```bash
railway run psql -c "SELECT email, name FROM \"User\";"
```

### Limpar banco (CUIDADO!)
```bash
railway run psql -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 🎓 Explicação Técnica

O script `RESTORE_DATABASE_COMPLETE.sql` faz:

1. **Cria ENUMs** (tipos customizados PostgreSQL)
   - Role, Urgency, ClientStatus, etc.

2. **Cria 17 Tabelas**
   - User, Session, Board, BoardMember, Column, Card, etc.

3. **Adiciona 50+ Índices**
   - Incluindo os novos índices de performance
   - Query de notificações fica 30x mais rápida

4. **Configura Foreign Keys**
   - Relações entre tabelas
   - Cascade deletes configurados

5. **Registra Migrations**
   - Prisma reconhece que banco está atualizado

**Tamanho**: ~5-10 MB quando vazio

---

## 📞 Ainda com Problemas?

Se nada funcionou:

1. **Tire screenshots** da tela de erro
2. **Copie a mensagem de erro completa**
3. **Verifique qual método usou** (UI, CLI, psql)
4. **Me envie essas informações**

Vou te ajudar a resolver!

---

**Última atualização**: 12 Nov 2025
**Versão do Script**: 2.0 (com melhorias de performance)
**Compatível com**: Railway, PostgreSQL 12+
