-- Criar enum NoteScope se não existir
DO $$ BEGIN
    CREATE TYPE "NoteScope" AS ENUM ('PERSONAL', 'BOARD', 'CARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela Note
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scope" "NoteScope" NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT,
    "cardId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");
CREATE INDEX IF NOT EXISTS "Note_boardId_idx" ON "Note"("boardId");
CREATE INDEX IF NOT EXISTS "Note_cardId_idx" ON "Note"("cardId");
CREATE INDEX IF NOT EXISTS "Note_scope_idx" ON "Note"("scope");
CREATE INDEX IF NOT EXISTS "Note_isPinned_idx" ON "Note"("isPinned");
CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt");

-- Adicionar foreign keys
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" ADD CONSTRAINT "Note_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "Board"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" ADD CONSTRAINT "Note_cardId_fkey"
    FOREIGN KEY ("cardId") REFERENCES "Card"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
