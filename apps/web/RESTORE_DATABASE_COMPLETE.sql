-- ============================================
-- NEXLIST - Restauração Completa do Banco de Dados
-- Data: 12 Nov 2025
-- Versão: 2.0 (Inclui melhorias de performance e segurança)
-- ============================================
--
-- INSTRUÇÕES:
-- Este arquivo SQL cria TODO o esquema do banco de dados do zero.
-- Execute este script no seu banco PostgreSQL de produção vazio.
--
-- ⚠️ ATENÇÃO: Se você tinha dados antigos, eles serão perdidos!
-- Faça backup antes se necessário.
--
-- ============================================

-- ============================================
-- 1. CRIAR ENUMS
-- ============================================

CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ClientStatus" AS ENUM ('NORMAL', 'NEUTRO', 'URGENTE', 'EMERGENCIA');
CREATE TYPE "OnboardStatus" AS ENUM ('ONBOARD', 'ATIVO', 'INATIVO');
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('INVITE', 'ALERT');
CREATE TYPE "ActivityType" AS ENUM (
  'CARD_CREATED',
  'CARD_UPDATED',
  'CARD_MOVED',
  'CARD_DELETED',
  'CARD_ASSIGNED',
  'CARD_UNASSIGNED',
  'CHECKLIST_CREATED',
  'CHECKLIST_ITEM_COMPLETED',
  'CHECKLIST_ITEM_UNCOMPLETED',
  'COMMENT_ADDED',
  'ATTACHMENT_ADDED',
  'ATTACHMENT_DELETED',
  'LABEL_ADDED',
  'LABEL_REMOVED',
  'CLIENT_STATUS_CHANGED',
  'DUE_DATE_CHANGED'
);

-- ============================================
-- 2. CRIAR TABELAS PRINCIPAIS
-- ============================================

-- Tabela User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Tabela Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Tabela Board
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isOrgWide" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- Tabela BoardMember
CREATE TABLE "BoardMember" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("id")
);

-- Tabela Column
CREATE TABLE "Column" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- Tabela Card
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "clientId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- Tabela Checklist
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- Tabela ChecklistItem
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- Tabela CardAssignee
CREATE TABLE "CardAssignee" (
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardAssignee_pkey" PRIMARY KEY ("cardId","userId")
);

-- Tabela Invite
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedById" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- Tabela Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedCardId" TEXT,
    "relatedBoardId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Tabela Comment
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Tabela Client
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'NORMAL',
    "onboardStatus" "OnboardStatus" NOT NULL DEFAULT 'ONBOARD',
    "lead" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "email" TEXT,
    "document" TEXT,
    "sector" TEXT,
    "region" TEXT,
    "notes" TEXT,
    "firstContact" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lastContact" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- Tabela Label
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- Tabela CardLabel
CREATE TABLE "CardLabel" (
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "CardLabel_pkey" PRIMARY KEY ("cardId","labelId")
);

-- Tabela Attachment
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- Tabela ChecklistTemplate
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- Tabela Activity (Audit Trail)
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "cardId" TEXT,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 3. CRIAR ÍNDICES
-- ============================================

-- User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Session
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- BoardMember
CREATE INDEX "BoardMember_boardId_idx" ON "BoardMember"("boardId");
CREATE INDEX "BoardMember_userId_idx" ON "BoardMember"("userId");
CREATE UNIQUE INDEX "BoardMember_boardId_userId_key" ON "BoardMember"("boardId", "userId");

-- Column
CREATE INDEX "Column_boardId_idx" ON "Column"("boardId");

-- Card (incluindo novos índices de performance)
CREATE INDEX "Card_boardId_idx" ON "Card"("boardId");
CREATE INDEX "Card_columnId_order_idx" ON "Card"("columnId", "order");
CREATE INDEX "Card_createdById_idx" ON "Card"("createdById");
CREATE INDEX "Card_clientId_idx" ON "Card"("clientId");
CREATE INDEX "Card_dueAt_idx" ON "Card"("dueAt");
CREATE INDEX "Card_completedAt_idx" ON "Card"("completedAt");
CREATE INDEX "Card_urgency_idx" ON "Card"("urgency");

-- Checklist
CREATE INDEX "Checklist_cardId_idx" ON "Checklist"("cardId");

-- ChecklistItem (incluindo novos índices de performance)
CREATE INDEX "ChecklistItem_checklistId_idx" ON "ChecklistItem"("checklistId");
CREATE INDEX "ChecklistItem_done_idx" ON "ChecklistItem"("done");
CREATE INDEX "ChecklistItem_doneAt_idx" ON "ChecklistItem"("doneAt");

-- CardAssignee
CREATE INDEX "CardAssignee_cardId_idx" ON "CardAssignee"("cardId");
CREATE INDEX "CardAssignee_userId_idx" ON "CardAssignee"("userId");

-- Invite
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
CREATE INDEX "Invite_boardId_idx" ON "Invite"("boardId");
CREATE INDEX "Invite_email_idx" ON "Invite"("email");
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- Notification (incluindo novos índices de performance)
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_relatedCardId_idx" ON "Notification"("relatedCardId");

-- Comment
CREATE INDEX "Comment_cardId_idx" ON "Comment"("cardId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- Client
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_onboardStatus_idx" ON "Client"("onboardStatus");
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- Label
CREATE INDEX "Label_boardId_idx" ON "Label"("boardId");

-- CardLabel
CREATE INDEX "CardLabel_cardId_idx" ON "CardLabel"("cardId");
CREATE INDEX "CardLabel_labelId_idx" ON "CardLabel"("labelId");

-- Attachment
CREATE INDEX "Attachment_cardId_idx" ON "Attachment"("cardId");
CREATE INDEX "Attachment_userId_idx" ON "Attachment"("userId");

-- ChecklistTemplate
CREATE INDEX "ChecklistTemplate_boardId_idx" ON "ChecklistTemplate"("boardId");

-- Activity
CREATE INDEX "Activity_boardId_idx" ON "Activity"("boardId");
CREATE INDEX "Activity_cardId_idx" ON "Activity"("cardId");
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_clientId_idx" ON "Activity"("clientId");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- ============================================
-- 4. ADICIONAR FOREIGN KEYS
-- ============================================

-- Session
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Board
ALTER TABLE "Board" ADD CONSTRAINT "Board_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BoardMember
ALTER TABLE "BoardMember" ADD CONSTRAINT "BoardMember_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardMember" ADD CONSTRAINT "BoardMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Column
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Card
ALTER TABLE "Card" ADD CONSTRAINT "Card_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Card" ADD CONSTRAINT "Card_columnId_fkey"
  FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Card" ADD CONSTRAINT "Card_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Card" ADD CONSTRAINT "Card_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Checklist
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChecklistItem
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey"
  FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CardAssignee
ALTER TABLE "CardAssignee" ADD CONSTRAINT "CardAssignee_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardAssignee" ADD CONSTRAINT "CardAssignee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invite
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notification
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedCardId_fkey"
  FOREIGN KEY ("relatedCardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comment
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Label
ALTER TABLE "Label" ADD CONSTRAINT "Label_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CardLabel
ALTER TABLE "CardLabel" ADD CONSTRAINT "CardLabel_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardLabel" ADD CONSTRAINT "CardLabel_labelId_fkey"
  FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Attachment
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChecklistTemplate
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Activity
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 5. CRIAR TABELA DE MIGRATIONS (Para Prisma)
-- ============================================

CREATE TABLE "_prisma_migrations" (
    "id" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- Registrar que migrations foram aplicadas
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES
  (gen_random_uuid()::text, 'consolidated', '20250930012214_init', NOW(), 1),
  (gen_random_uuid()::text, 'consolidated', '20250930015203_add_comments_and_notifications', NOW(), 1),
  (gen_random_uuid()::text, 'consolidated', '20250930150235_add_role_to_invite', NOW(), 1),
  (gen_random_uuid()::text, 'consolidated', '20251112000000_add_optimized_indexes', NOW(), 1);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar sucesso
SELECT 'Database restored successfully!' AS status,
       COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
