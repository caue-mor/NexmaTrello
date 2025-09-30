import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Check if Trello Geral already exists
  const existingBoard = await prisma.board.findFirst({
    where: { title: "Trello Geral Nexma" },
  });

  if (existingBoard) {
    console.log("Trello Geral already exists, skipping seed.");
    return;
  }

  // Get or create a system user for ownership
  let systemUser = await prisma.user.findFirst({
    where: { email: "system@nexma.internal" },
  });

  if (!systemUser) {
    // Create system user (with a random password hash since it won't be used for login)
    const argon2 = await import("argon2");
    const passwordHash = await argon2.hash("system-internal-only");

    systemUser = await prisma.user.create({
      data: {
        email: "system@nexma.internal",
        name: "Sistema Nexma",
        passwordHash,
        isActive: true,
      },
    });
  }

  // Create Trello Geral board
  const board = await prisma.board.create({
    data: {
      title: "Trello Geral Nexma",
      isOrgWide: true,
      ownerId: systemUser.id,
    },
  });

  console.log(`Created board: ${board.title}`);

  // Create columns for different departments
  const departments = [
    { title: "📢 Anúncios Gerais", order: 0 },
    { title: "🎨 Design", order: 1 },
    { title: "💻 Desenvolvimento", order: 2 },
    { title: "📈 Marketing", order: 3 },
    { title: "💼 Vendas", order: 4 },
    { title: "🎯 Projetos", order: 5 },
  ];

  for (const dept of departments) {
    await prisma.column.create({
      data: {
        boardId: board.id,
        title: dept.title,
        order: dept.order,
      },
    });
    console.log(`Created column: ${dept.title}`);
  }

  // Create welcome card
  const announcementsColumn = await prisma.column.findFirst({
    where: {
      boardId: board.id,
      title: "📢 Anúncios Gerais",
    },
  });

  if (announcementsColumn) {
    await prisma.card.create({
      data: {
        boardId: board.id,
        columnId: announcementsColumn.id,
        title: "🎉 Bem-vindo ao Trello Geral da Nexma!",
        description: `Este é o espaço compartilhado de toda a empresa.

📋 Como usar:
- Use as categorias por departamento para organizar cards
- Todos da empresa podem ver e interagir
- Ideal para anúncios, projetos compartilhados e comunicação geral

🚀 Vamos colaborar!`,
        urgency: "MEDIUM",
        createdById: systemUser.id,
      },
    });
    console.log("Created welcome card");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });