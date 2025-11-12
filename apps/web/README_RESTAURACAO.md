# 🚨 RESTAURAR BANCO DE DADOS - 3 MÉTODOS

Seu banco Railway está vazio. Escolha um dos métodos abaixo:

---

## 🥇 MÉTODO 1: Via Railway UI (MAIS FÁCIL) ⭐

### O que você precisa:
- Navegador web
- 3 minutos

### Passo a passo rápido:
1. Acesse https://railway.app
2. Abra projeto "NexmaTrello"
3. Clique em "Postgres"
4. Clique na aba "Data" → "Query"
5. Copie TODO o conteúdo de: `RESTORE_DATABASE_COMPLETE.sql`
6. Cole no editor SQL
7. Clique "Run"
8. Aguarde ~30 segundos
9. Pronto! ✅

### Guia detalhado com screenshots:
👉 **Leia: `RESTAURAR_RAILWAY_PASSO_A_PASSO.md`**

---

## 🥈 MÉTODO 2: Via Script Automático (RÁPIDO)

### O que você precisa:
- Terminal
- Connection string do Railway
- PostgreSQL client (`psql`)

### Como executar:

```bash
# 1. Ir para a pasta
cd apps/web

# 2. Executar script
./restaurar-banco.sh

# 3. Quando pedir, cole a connection string do Railway
#    (Pegue em: Railway > Postgres > Connect > Copy URL)

# 4. Digite 's' para confirmar

# 5. Aguarde ~30 segundos

# ✅ Pronto!
```

### Instalar psql (se não tiver):
```bash
# Mac
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client

# Windows
# Download: https://www.postgresql.org/download/windows/
```

---

## 🥉 MÉTODO 3: Via Railway CLI (AVANÇADO)

### O que você precisa:
- Railway CLI instalado
- Terminal

### Como executar:

```bash
# 1. Instalar CLI (se não tiver)
npm install -g @railway/cli

# 2. Login (abrirá browser)
railway login

# 3. Link ao projeto
railway link
# (Escolha: NexmaTrello)

# 4. Executar SQL
railway run psql < RESTORE_DATABASE_COMPLETE.sql

# ✅ Pronto!
```

---

## ✅ Após Restaurar (TODOS OS MÉTODOS)

### 1. Verificar se funcionou:
- Vá em Railway > Postgres > Data
- Deve mostrar ~17 tabelas (User, Board, Card, etc.)

### 2. Criar usuários de teste:
```bash
cd apps/web
npm run seed:users-only
```

### 3. Criar board geral:
```bash
npm run add:general
```

### 4. Testar local:
```bash
npm run dev
```

**Login**: `alice@nexma.com`
**Senha**: `senha123`

### 5. Se funcionou, fazer deploy:
```bash
git add .
git commit -m "fix: restaurar banco de dados"
git push
```

---

## 🆘 Problemas?

### Erro: "type Role already exists"
Execute isso no Railway Query:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Depois execute o SQL novamente.

### Erro: "psql: command not found"
Instale PostgreSQL client (veja Método 2 acima).

### Login não funciona após restaurar
Normal! Execute:
```bash
npm run seed:users-only
```

### Aplicação dá erro mesmo com tabelas
Execute:
```bash
npx prisma generate
npm run dev
```

---

## 📊 O Que Será Criado

✅ 8 ENUMs (tipos)
✅ 17 Tabelas
✅ 50+ Índices
✅ Todas as Foreign Keys
✅ Registro de migrations

**Tamanho**: ~5-10 MB (vazio)

---

## 🎯 Recomendação

**Para iniciantes**: Use MÉTODO 1 (UI)
**Para rápido**: Use MÉTODO 2 (Script)
**Para quem conhece Railway CLI**: Use MÉTODO 3

---

**Tempo total** (incluindo testes): ~10-15 minutos
**Dificuldade**: ⭐ Fácil a ⭐⭐ Médio

---

## 📞 Ainda com dúvidas?

Todos os guias estão em:
- `RESTAURAR_RAILWAY_PASSO_A_PASSO.md` - Guia visual completo
- `COMO_RESTAURAR_BANCO.md` - Guia técnico detalhado
- `RESTORE_DATABASE_COMPLETE.sql` - SQL para executar

Ou me envie mensagem! 🚀
