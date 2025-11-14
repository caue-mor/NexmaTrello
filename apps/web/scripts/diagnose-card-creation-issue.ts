import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 DIAGNÓSTICO COMPLETO - Problema de criação de cards\n");
    console.log("=" .repeat(60));

    // 1. Verificar usuários inativos
    console.log("\n1️⃣  VERIFICANDO USUÁRIOS INATIVOS");
    console.log("-".repeat(60));
    const inactiveUsers = await prisma.user.findMany({
      where: { isActive: false },
      select: { id: true, email: true, name: true },
    });

    if (inactiveUsers.length > 0) {
      console.log(`❌ PROBLEMA! ${inactiveUsers.length} usuário(s) inativo(s):`);
      inactiveUsers.forEach((u) => {
        console.log(`   - ${u.name || "Sem nome"} (${u.email})`);
      });
      console.log("\n⚠️  Usuários inativos NÃO podem criar cards!");
      console.log("   Solução: Ativar esses usuários no banco de dados");
    } else {
      console.log("✅ Todos os usuários estão ativos");
    }

    // 2. Verificar boards e memberships
    console.log("\n\n2️⃣  VERIFICANDO BOARDS E MEMBERSHIPS");
    console.log("-".repeat(60));

    const boards = await prisma.board.findMany({
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    for (const board of boards) {
      console.log(`\n📋 Board: "${board.title}"`);
      console.log(`   Owner: ${board.owner.name} (${board.owner.email})`);
      console.log(`   IsOrgWide: ${board.isOrgWide}`);
      console.log(`   Total de membros: ${board.members.length}`);

      // Verificar se o owner está na lista de membros
      const ownerIsMember = board.members.some(
        (m) => m.userId === board.ownerId
      );
      if (!ownerIsMember) {
        console.log(`   ⚠️  OWNER NÃO ESTÁ NA LISTA DE MEMBROS!`);
      }

      // Listar membros e seus roles
      board.members.forEach((member) => {
        const isOwner = member.userId === board.ownerId;
        console.log(
          `   ${isOwner ? "👑" : "👤"} ${member.user.name} - Role: ${member.role}`
        );
      });
    }

    // 3. Verificar invites pendentes
    console.log("\n\n3️⃣  VERIFICANDO CONVITES PENDENTES");
    console.log("-".repeat(60));

    const pendingInvites = await prisma.invite.findMany({
      where: { status: "PENDING" },
      include: {
        board: {
          select: { id: true, title: true },
        },
      },
    });

    if (pendingInvites.length > 0) {
      console.log(`📬 ${pendingInvites.length} convite(s) pendente(s):`);
      for (const invite of pendingInvites) {
        console.log(`   - ${invite.email} → "${invite.board.title}" (Role: ${invite.role})`);

        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
          where: { email: invite.email },
        });

        if (!user) {
          console.log(`     ⚠️  Usuário não cadastrado no sistema`);
        } else {
          // Verificar se já é membro
          const isMember = await prisma.boardMember.findUnique({
            where: {
              boardId_userId: {
                boardId: invite.boardId,
                userId: user.id,
              },
            },
          });

          if (isMember) {
            console.log(`     ❌ PROBLEMA! Usuário JÁ É MEMBRO mas o convite está PENDING`);
          }
        }
      }
    } else {
      console.log("✅ Nenhum convite pendente");
    }

    // 4. Resumo final
    console.log("\n\n📊 RESUMO FINAL");
    console.log("=".repeat(60));
    console.log(`Total de boards: ${boards.length}`);
    console.log(`Total de usuários: ${await prisma.user.count()}`);
    console.log(`Usuários inativos: ${inactiveUsers.length}`);
    console.log(`Convites pendentes: ${pendingInvites.length}`);

    if (inactiveUsers.length === 0 && pendingInvites.length === 0) {
      console.log("\n💡 DIAGNÓSTICO:");
      console.log("   Não foram encontrados problemas óbvios de configuração.");
      console.log("   O erro pode estar relacionado a:");
      console.log("   1. Rate limiting (muitas requisições)");
      console.log("   2. CSRF token (embora esteja desabilitado)");
      console.log("   3. Erro de validação nos dados enviados");
      console.log("\n   Para diagnosticar melhor, verifique:");
      console.log("   - Logs do servidor em produção");
      console.log("   - Console do navegador (F12)");
      console.log("   - Mensagem de erro exata que aparece para o usuário");
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Erro ao executar diagnóstico:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
