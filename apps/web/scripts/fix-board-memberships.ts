import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 CORRIGINDO BOARD MEMBERSHIPS\n");
    console.log("=".repeat(70));

    let fixed = 0;

    // 1. Adicionar owners como membros se não estiverem
    console.log("\n1️⃣  Verificando owners sem membership...");
    const boards = await prisma.board.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: { userId: true } },
      },
    });

    for (const board of boards) {
      const ownerIsMember = board.members.some(
        (m) => m.userId === board.ownerId
      );

      if (!ownerIsMember) {
        console.log(
          `   ➕ Adicionando ${board.owner.name} como OWNER do board "${board.title}"`
        );
        await prisma.boardMember.create({
          data: {
            id: crypto.randomUUID(),
            boardId: board.id,
            userId: board.ownerId,
            role: "OWNER",
          },
        });
        fixed++;
      }
    }

    if (fixed === 0) {
      console.log("   ✅ Todos os owners já são membros");
    }

    // 2. Adicionar memberships para invites aceitos
    console.log("\n2️⃣  Verificando invites aceitos sem membership...");
    const acceptedInvites = await prisma.invite.findMany({
      where: { status: "ACCEPTED" },
      include: {
        board: { select: { id: true, title: true } },
        acceptedBy: { select: { id: true, name: true, email: true } },
      },
    });

    for (const invite of acceptedInvites) {
      if (!invite.acceptedBy) continue;

      // Verificar se já existe membership
      const existing = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: invite.boardId,
            userId: invite.acceptedBy.id,
          },
        },
      });

      if (!existing) {
        console.log(
          `   ➕ Adicionando ${invite.acceptedBy.name} como ${invite.role} do board "${invite.board.title}"`
        );
        await prisma.boardMember.create({
          data: {
            id: crypto.randomUUID(),
            boardId: invite.boardId,
            userId: invite.acceptedBy.id,
            role: invite.role,
          },
        });
        fixed++;
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log(`✅ Total de memberships corrigidas: ${fixed}`);

    if (fixed > 0) {
      console.log(
        "\n💡 Agora os usuários devem conseguir criar cards normalmente!"
      );
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
