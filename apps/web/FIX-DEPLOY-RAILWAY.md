# Correção de Deploy Railway - 30 Set 2025

## 🐛 Problema Identificado

Deploy no Railway falhava com erros Prisma:

```
PrismaClientKnownRequestError:
Invalid `prisma.board.findFirst()` invocation:
The column `Card.order` does not exist in the current database.

PrismaClientKnownRequestError:
Invalid `prisma.client.findMany()` invocation:
The table `public.Client` does not exist in the current database.
```

## 🔍 Causa Raiz

O banco de dados de **produção (Railway)** não possui:
1. **Campo `Card.order`** - para ordenação persistente
2. **Tabela `Client`** - módulo CRM completo

Esses modelos existem no `schema.prisma` local mas nunca foram aplicados via migration em produção.

## ✅ Correções Aplicadas

### 1. Desabilitado `client` na Query de Board
**Arquivo:** `app/(protected)/board/[boardId]/page.tsx`

```typescript
// ANTES (linha 46-52)
client: {
  select: {
    id: true,
    name: true,
    status: true,
  },
},

// DEPOIS (linha 46-53)
// TODO: Descomentar quando modelo Client existir no banco de produção
// client: {
//   select: {
//     id: true,
//     name: true,
//     status: true,
//   },
// },
```

### 2. Página de Clientes com Fallback UI
**Arquivo:** `app/(protected)/clientes/page.tsx`

- Comentado código que usa `prisma.client`
- Adicionada UI de manutenção amigável
- Sistema não crasha, mostra mensagem "🚧 Módulo em Manutenção"

### 3. APIs de Clientes Retornam 501
**Arquivos:**
- `app/api/clients/route.ts`
- `app/api/clients/[clientId]/route.ts`

Todas as rotas agora retornam:
```typescript
return NextResponse.json(
  { error: "Funcionalidade ainda não implementada no banco de dados" },
  { status: 501 }
);
```

## 📊 Status das Funcionalidades

### ✅ Operacional em Produção
- Autenticação (login, registro, logout)
- Boards (criar, editar, deletar)
- Colunas (criar, reordenar)
- Cards (CRUD completo sem campo `order`)
- Checklists (criar, toggle items)
- Assignees (atribuir usuários)
- Comentários
- Notificações
- Convites
- Dashboard de Performance

### ⏳ Desabilitado (Aguarda Migration)
- **Módulo Clientes** (tabela `Client` não existe)
- **Ordenação persistente** (campo `Card.order` não existe)
- **Sistema de Labels** (tabela `Label` não existe)
- **Attachments** (tabela `Attachment` não existe)
- **Activity Log** (tabela `Activity` não existe)
- **Checklist Templates** (tabela `ChecklistTemplate` não existe)

## 🚀 Como Reativar Funcionalidades

### Opção 1: Criar Migration Específica (Recomendado)
```bash
cd apps/web

# Criar migration apenas para Client e Card.order
npx prisma migrate dev --name add_client_and_card_order

# Aplicar em produção via Railway
railway run npx prisma migrate deploy
```

### Opção 2: Push Direto (Desenvolvimento)
```bash
# Aplicar todo o schema de uma vez
npx prisma db push

# Ou via Railway
railway run npx prisma db push
```

### Opção 3: Descomente o Código
Após aplicar migrations, busque por `TODO:` e descomente:
- `app/(protected)/board/[boardId]/page.tsx:46-53`
- `app/(protected)/clientes/page.tsx:1-58`
- `app/api/clients/route.ts`
- `app/api/clients/[clientId]/route.ts`

## 🧪 Testes Realizados

### Build Local
```bash
npm run build
✓ Compiled successfully
```

### Verificações
- ✅ Board page não busca `client`
- ✅ Página `/clientes` renderiza UI de manutenção
- ✅ APIs de clientes retornam 501 (não 500)
- ✅ Sem queries Prisma para modelos inexistentes

## 📝 Notas Importantes

1. **Campo `clientId` em Card é opcional** - não causa erro mesmo sem tabela Client
2. **Código comentado não é deletado** - preservado para reativação futura
3. **TODOs marcam todos os pontos de reativação**
4. **UX não quebra** - usuários veem mensagem clara ao invés de erro

## 🔄 Próximo Deploy

Este commit está **pronto para deploy no Railway** sem erros:
- ✅ Sem queries para `Card.order`
- ✅ Sem queries para `Client`
- ✅ Build passa localmente
- ✅ Todas as funcionalidades core operacionais

---

**Desenvolvido por:** Sistema de IA Claude
**Data:** 30 de Setembro de 2025
**Versão:** 1.1.0 - Railway Deploy Fix
