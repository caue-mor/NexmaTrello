import { PrismaClient } from "@prisma/client";
import { assertBoardRole } from "../lib/rbac";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Testando permissões de board...\n");

    // Buscar todos os boards
    const boards = await prisma.board.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    for (const board of boards) {
      console.log(`📋 Board: "${board.title}" (${board.id})`);
      console.log(`   Owner: ${board.owner.name} (${board.owner.email})`);
      console.log(`   IsOrgWide: ${board.isOrgWide}`);
      console.log(`   Membros:`);

      for (const member of board.members) {
        console.log(
          `   - ${member.user.name} (${member.user.email}) - Role: ${member.role}`
        );

        // Testar se esse membro conseguiria criar um card
        try {
          await assertBoardRole(board.id, member.userId);
          console.log(`     ✅ Pode criar cards`);
        } catch (err) {
          console.log(`     ❌ NÃO pode criar cards - Erro: ${err instanceof Error ? err.message : err}`);
        }
      }

      console.log("");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
