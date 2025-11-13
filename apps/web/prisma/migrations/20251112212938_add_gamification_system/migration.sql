-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('NORMAL', 'NEUTRO', 'URGENTE', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "OnboardStatus" AS ENUM ('ONBOARD', 'ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CARD_CREATED', 'CARD_UPDATED', 'CARD_MOVED', 'CARD_DELETED', 'CARD_ASSIGNED', 'CARD_UNASSIGNED', 'CHECKLIST_CREATED', 'CHECKLIST_ITEM_COMPLETED', 'CHECKLIST_ITEM_UNCOMPLETED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_DELETED', 'LABEL_ADDED', 'LABEL_REMOVED', 'CLIENT_STATUS_CHANGED', 'DUE_DATE_CHANGED');

-- CreateEnum
CREATE TYPE "NoteScope" AS ENUM ('PERSONAL', 'BOARD', 'CARD');

-- DropIndex
DROP INDEX "Card_columnId_idx";

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
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
    "lastContact" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardLabel" (
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "CardLabel_pkey" PRIMARY KEY ("cardId","labelId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "cardId" TEXT,
    "clientId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
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

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksCompletedOnTime" INTEGER NOT NULL DEFAULT 0,
    "cardsCompleted" INTEGER NOT NULL DEFAULT 0,
    "cardsCompletedOnTime" INTEGER NOT NULL DEFAULT 0,
    "criticalCardsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementKey" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_onboardStatus_idx" ON "Client"("onboardStatus");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Label_boardId_idx" ON "Label"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_boardId_name_key" ON "Label"("boardId", "name");

-- CreateIndex
CREATE INDEX "CardLabel_cardId_idx" ON "CardLabel"("cardId");

-- CreateIndex
CREATE INDEX "CardLabel_labelId_idx" ON "CardLabel"("labelId");

-- CreateIndex
CREATE INDEX "Attachment_cardId_idx" ON "Attachment"("cardId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedBy_idx" ON "Attachment"("uploadedBy");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_boardId_idx" ON "ChecklistTemplate"("boardId");

-- CreateIndex
CREATE INDEX "Activity_boardId_idx" ON "Activity"("boardId");

-- CreateIndex
CREATE INDEX "Activity_cardId_idx" ON "Activity"("cardId");

-- CreateIndex
CREATE INDEX "Activity_clientId_idx" ON "Activity"("clientId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_boardId_idx" ON "Note"("boardId");

-- CreateIndex
CREATE INDEX "Note_cardId_idx" ON "Note"("cardId");

-- CreateIndex
CREATE INDEX "Note_scope_idx" ON "Note"("scope");

-- CreateIndex
CREATE INDEX "Note_isPinned_idx" ON "Note"("isPinned");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_userId_idx" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_level_idx" ON "UserStats"("level");

-- CreateIndex
CREATE INDEX "UserStats_xp_idx" ON "UserStats"("xp");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementKey_idx" ON "UserAchievement"("achievementKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementKey_key" ON "UserAchievement"("userId", "achievementKey");

-- CreateIndex
CREATE INDEX "Card_columnId_order_idx" ON "Card"("columnId", "order");

-- CreateIndex
CREATE INDEX "Card_clientId_idx" ON "Card"("clientId");

-- CreateIndex
CREATE INDEX "Card_dueAt_idx" ON "Card"("dueAt");

-- CreateIndex
CREATE INDEX "Card_completedAt_idx" ON "Card"("completedAt");

-- CreateIndex
CREATE INDEX "Card_urgency_idx" ON "Card"("urgency");

-- CreateIndex
CREATE INDEX "ChecklistItem_done_idx" ON "ChecklistItem"("done");

-- CreateIndex
CREATE INDEX "ChecklistItem_doneAt_idx" ON "ChecklistItem"("doneAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_relatedCardId_idx" ON "Notification"("relatedCardId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardLabel" ADD CONSTRAINT "CardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardLabel" ADD CONSTRAINT "CardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
