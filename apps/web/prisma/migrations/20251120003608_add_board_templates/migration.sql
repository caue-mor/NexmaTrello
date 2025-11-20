-- CreateTable
CREATE TABLE "BoardTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Geral',
    "columns" JSONB NOT NULL,
    "cards" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardTemplate_category_idx" ON "BoardTemplate"("category");
