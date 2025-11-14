import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 VERIFICANDO MEMBERSHIPS DOS BOARDS\n");
    console.log("=".repeat(70));

    const boards = await prisma.board.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true, isActive: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, isActive: true },
            },
          },
        },
      },
    });

    let problemsFound = 0;

    for (const board of boards) {
      console.log(`\n📋 Board: "${board.title}"`);
      console.log(`   Owner: ${board.owner.name} (${board.owner.email})`);
      console.log(`   Owner isActive: ${board.owner.isActive ? "✅" : "❌"}`);

      // Verificar se o owner está na lista de membros
      const ownerAsMember = board.members.find(
        (m) => m.userId === board.ownerId
      );

      if (!ownerAsMember) {
        console.log(`   ⚠️  ATENÇÃO: Owner NÃO está na lista de membros`);
        console.log(`   Isso pode causar problemas de permissão!`);
        problemsFound++;
      }

      console.log(`   Total de membros registrados: ${board.members.length}`);

      if (board.members.length === 0) {
        console.log(`   ❌ PROBLEMA: Board sem membros!`);
        problemsFound++;
      }

      board.members.forEach((member) => {
        const icon = member.userId === board.ownerId ? "👑" : "👤";
        const activeIcon = member.user.isActive ? "✅" : "❌";
        console.log(
          `   ${icon} ${member.user.name} (${member.user.email}) - Role: ${member.role} - Ativo: ${activeIcon}`
        );

        if (!member.user.isActive) {
          console.log(`      ❌ PROBLEMA: Usuário INATIVO não pode criar cards!`);
          problemsFound++;
        }
      });
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 RESUMO");
    console.log("=".repeat(70));
    console.log(`Total de boards: ${boards.length}`);
    console.log(`Problemas encontrados: ${problemsFound}`);

    if (problemsFound > 0) {
      console.log("\n⚠️  AÇÃO NECESSÁRIA:");
      console.log(
        "   Existem problemas de membership que podem impedir criação de cards."
      );
      console.log(
        "   Membros precisam ter registro em BoardMember para criar cards."
      );
    } else {
      console.log("\n✅ Todas as memberships estão corretas!");
    }

    // Buscar invites aceitos mas sem BoardMember correspondente
    console.log("\n" + "=".repeat(70));
    console.log("🔍 VERIFICANDO INVITES ACEITOS SEM MEMBERSHIP");
    console.log("=".repeat(70));

    const acceptedInvites = await prisma.invite.findMany({
      where: { status: "ACCEPTED" },
      include: {
        board: { select: { id: true, title: true } },
        acceptedBy: { select: { id: true, name: true, email: true } },
      },
    });

    let orphanedInvites = 0;

    for (const invite of acceptedInvites) {
      if (!invite.acceptedBy) continue;

      const membership = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: invite.boardId,
            userId: invite.acceptedBy.id,
          },
        },
      });

      if (!membership) {
        console.log(
          `❌ PROBLEMA: ${invite.acceptedBy.name} aceitou convite para "${invite.board.title}" mas NÃO tem BoardMember!`
        );
        orphanedInvites++;
      }
    }

    if (orphanedInvites > 0) {
      console.log(
        `\n⚠️  ${orphanedInvites} convite(s) aceito(s) sem BoardMember correspondente!`
      );
      console.log("   Isso IMPEDE que esses usuários criem cards!");
      console.log("\n💡 SOLUÇÃO:");
      console.log("   Execute: npm run fix:memberships");
    } else {
      console.log("✅ Todos os convites aceitos têm BoardMember correspondente");
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
