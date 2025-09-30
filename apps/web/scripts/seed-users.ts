import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de usuários...");

  // Senha padrão para todos os usuários de teste
  const password = "senha123";
  const hashedPassword = await argon2.hash(password);

  // Lista de usuários de teste
  const users = [
    {
      email: "alice@nexma.com",
      name: "Alice Silva",
      passwordHash: hashedPassword,
    },
    {
      email: "bob@nexma.com",
      name: "Bob Santos",
      passwordHash: hashedPassword,
    },
    {
      email: "carol@nexma.com",
      name: "Carol Oliveira",
      passwordHash: hashedPassword,
    },
    {
      email: "david@nexma.com",
      name: "David Costa",
      passwordHash: hashedPassword,
    },
    {
      email: "eva@nexma.com",
      name: "Eva Ferreira",
      passwordHash: hashedPassword,
    },
    {
      email: "daniel@nexma.com",
      name: "Daniel",
      passwordHash: hashedPassword,
    },
    {
      email: "carlos@nexma.com",
      name: "Carlos",
      passwordHash: hashedPassword,
    },
    {
      email: "caue@nexma.com",
      name: "Cauê",
      passwordHash: hashedPassword,
    },
    {
      email: "whanderson@nexma.com",
      name: "Whanderson",
      passwordHash: hashedPassword,
    },
    {
      email: "steve@nexma.com",
      name: "Steve",
      passwordHash: hashedPassword,
    },
    {
      email: "patrik@nexma.com",
      name: "Patrik",
      passwordHash: hashedPassword,
    },
  ];

  console.log("👥 Criando usuários de teste...");

  for (const user of users) {
    try {
      const created = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
      console.log(`✅ Usuário criado/atualizado: ${created.email} (${created.name})`);
    } catch (error) {
      console.error(`❌ Erro ao criar ${user.email}:`, error);
    }
  }

  // Buscar todos os boards e adicionar os usuários de teste como membros
  console.log("\n📋 Adicionando usuários aos boards existentes...");

  const boards = await prisma.board.findMany({
    select: { id: true, title: true },
  });

  const createdUsers = await prisma.user.findMany({
    where: {
      email: {
        in: users.map((u) => u.email),
      },
    },
  });

  for (const board of boards) {
    console.log(`\n📌 Board: ${board.title}`);

    for (const user of createdUsers) {
      try {
        // Verificar se já é membro
        const existing = await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId: board.id,
              userId: user.id,
            },
          },
        });

        if (!existing) {
          await prisma.boardMember.create({
            data: {
              boardId: board.id,
              userId: user.id,
              role: "MEMBER",
            },
          });
          console.log(`  ✅ ${user.name} adicionado como MEMBER`);
        } else {
          console.log(`  ⏭️  ${user.name} já é membro`);
        }
      } catch (error) {
        console.error(`  ❌ Erro ao adicionar ${user.name}:`, error);
      }
    }
  }

  console.log("\n✨ Seed concluído!");
  console.log("\n📝 Credenciais de login:");
  console.log("   Email: alice@nexma.com (ou qualquer outro)");
  console.log("   Senha: senha123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });