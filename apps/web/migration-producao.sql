-- ============================================
-- MIGRATION: Sincronizar Schema de Produção
-- Data: 30 Set 2025
-- Objetivo: Adicionar tabelas e campos faltantes
-- ============================================

-- 1. ADICIONAR CAMPO Card.order
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Card' AND column_name = 'order'
    ) THEN
        ALTER TABLE "Card" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
        CREATE INDEX "Card_columnId_order_idx" ON "Card"("columnId", "order");
        RAISE NOTICE 'Campo Card.order adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo Card.order já existe';
    END IF;
END $$;

-- 2. CRIAR TABELA Client
-- ============================================
CREATE TABLE IF NOT EXISTS "Client" (
    id TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS "Client_status_idx" ON "Client"(status);
CREATE INDEX IF NOT EXISTS "Client_createdAt_idx" ON "Client"("createdAt");
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"(email);

-- 3. CRIAR TABELA Activity
-- ============================================
CREATE TABLE IF NOT EXISTS "Activity" (
    id TEXT PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "cardId" TEXT,
    "clientId" TEXT,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Activity_boardId_idx" ON "Activity"("boardId");
CREATE INDEX IF NOT EXISTS "Activity_cardId_idx" ON "Activity"("cardId");
CREATE INDEX IF NOT EXISTS "Activity_clientId_idx" ON "Activity"("clientId");
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity"(type);

-- 4. CRIAR TABELA Label
-- ============================================
CREATE TABLE IF NOT EXISTS "Label" (
    id TEXT PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Label_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Label_boardId_name_key" UNIQUE ("boardId", name)
);

CREATE INDEX IF NOT EXISTS "Label_boardId_idx" ON "Label"("boardId");

-- 5. CRIAR TABELA CardLabel
-- ============================================
CREATE TABLE IF NOT EXISTS "CardLabel" (
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    PRIMARY KEY ("cardId", "labelId"),
    CONSTRAINT "CardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CardLabel_cardId_idx" ON "CardLabel"("cardId");
CREATE INDEX IF NOT EXISTS "CardLabel_labelId_idx" ON "CardLabel"("labelId");

-- 6. CRIAR TABELA Attachment
-- ============================================
CREATE TABLE IF NOT EXISTS "Attachment" (
    id TEXT PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"(id) ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Attachment_cardId_idx" ON "Attachment"("cardId");
CREATE INDEX IF NOT EXISTS "Attachment_uploadedBy_idx" ON "Attachment"("uploadedBy");

-- 7. CRIAR TABELA ChecklistTemplate
-- ============================================
CREATE TABLE IF NOT EXISTS "ChecklistTemplate" (
    id TEXT PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChecklistTemplate_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ChecklistTemplate_boardId_idx" ON "ChecklistTemplate"("boardId");

-- 8. CRIAR ENUM ClientStatus (se não existir)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientStatus') THEN
        CREATE TYPE "ClientStatus" AS ENUM ('NORMAL', 'NEUTRO', 'URGENTE', 'EMERGENCIA');
        RAISE NOTICE 'Enum ClientStatus criado';
    ELSE
        RAISE NOTICE 'Enum ClientStatus já existe';
    END IF;
END $$;

-- 9. CRIAR ENUM ActivityType (se não existir)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
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
        RAISE NOTICE 'Enum ActivityType criado';
    ELSE
        RAISE NOTICE 'Enum ActivityType já existe';
    END IF;
END $$;

-- 10. ATUALIZAR COLUNA Client.status para usar ENUM (se necessário)
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Client'
        AND column_name = 'status'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "Client"
        ALTER COLUMN status TYPE "ClientStatus"
        USING status::"ClientStatus";
        RAISE NOTICE 'Coluna Client.status convertida para enum';
    ELSE
        RAISE NOTICE 'Coluna Client.status já é enum ou não existe';
    END IF;
END $$;

-- 11. ATUALIZAR COLUNA Activity.type para usar ENUM (se necessário)
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Activity'
        AND column_name = 'type'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "Activity"
        ALTER COLUMN type TYPE "ActivityType"
        USING type::"ActivityType";
        RAISE NOTICE 'Coluna Activity.type convertida para enum';
    ELSE
        RAISE NOTICE 'Coluna Activity.type já é enum ou não existe';
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '_prisma%';

    RAISE NOTICE '✅ Migration concluída! Total de tabelas: %', table_count;
    RAISE NOTICE '✅ Tabelas esperadas: 19 (User, Session, Board, BoardMember, Column, Card, Checklist, ChecklistItem, CardAssignee, Invite, Notification, Comment, Client, Activity, Label, CardLabel, Attachment, ChecklistTemplate + _prisma_migrations)';
END $$;

-- Listar todas as tabelas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
