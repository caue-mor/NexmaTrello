import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Iniciando testes do sistema...\n");

  let passed = 0;
  let failed = 0;

  // Teste 1: Verificar usuários no banco
  console.log("📝 Teste 1: Verificar usuários cadastrados");
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });

    const expectedUsers = [
      "alice@nexma.com",
      "bob@nexma.com",
      "carol@nexma.com",
      "david@nexma.com",
      "eva@nexma.com",
      "daniel@nexma.com",
      "carlos@nexma.com",
      "caue@nexma.com",
      "whanderson@nexma.com",
      "steve@nexma.com",
      "patrik@nexma.com",
    ];

    const userEmails = users.map((u) => u.email);
    const allExist = expectedUsers.every((email) => userEmails.includes(email));

    if (allExist && users.length >= expectedUsers.length) {
      console.log(`   ✅ PASSOU - ${users.length} usuários encontrados`);
      users.forEach((u) => console.log(`      • ${u.name} (${u.email})`));
      passed++;
    } else {
      console.log(`   ❌ FALHOU - Usuários faltando`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FALHOU - Erro: ${error}`);
    failed++;
  }

  // Teste 2: Verificar boards existentes
  console.log("\n📝 Teste 2: Verificar boards e seus donos");
  try {
    const boards = await prisma.board.findMany({
      select: {
        id: true,
        title: true,
        ownerId: true,
        isOrgWide: true,
        _count: {
          select: { members: true },
        },
      },
    });

    console.log(`   ✅ PASSOU - ${boards.length} boards encontrados`);
    for (const board of boards) {
      console.log(`      • ${board.title}`);
      console.log(`        - ID: ${board.id}`);
      console.log(`        - Org-wide: ${board.isOrgWide}`);
      console.log(`        - Membros: ${board._count.members}`);
    }
    passed++;
  } catch (error) {
    console.log(`   ❌ FALHOU - Erro: ${error}`);
    failed++;
  }

  // Teste 3: Verificar membros dos boards
  console.log("\n📝 Teste 3: Verificar membros dos boards");
  try {
    const boards = await prisma.board.findMany({
      select: {
        id: true,
        title: true,
        ownerId: true,
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: { email: true, name: true },
            },
          },
        },
      },
    });

    console.log(`   ✅ PASSOU - Estrutura de membros OK`);
    for (const board of boards) {
      console.log(`      • ${board.title}: ${board.members.length} membro(s)`);
      board.members.forEach((m) => {
        console.log(`        - ${m.user.name} (${m.user.email}) [${m.role}]`);
      });
    }
    passed++;
  } catch (error) {
    console.log(`   ❌ FALHOU - Erro: ${error}`);
    failed++;
  }

  // Teste 4: Verificar API de usuários disponíveis (simulação)
  console.log("\n📝 Teste 4: Testar lógica de usuários disponíveis");
  try {
    const board = await prisma.board.findFirst();
    if (!board) {
      console.log(`   ⚠️  PULADO - Nenhum board encontrado`);
    } else {
      // Buscar todos usuários
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true },
      });

      // Buscar membros do board
      const members = await prisma.boardMember.findMany({
        where: { boardId: board.id },
        select: { userId: true },
      });

      const memberIds = new Set(members.map((m) => m.userId));

      // Adicionar flag isMember
      const usersWithFlag = allUsers.map((u) => ({
        ...u,
        isMember: memberIds.has(u.id),
      }));

      const membersCount = usersWithFlag.filter((u) => u.isMember).length;
      const nonMembersCount = usersWithFlag.filter((u) => !u.isMember).length;

      console.log(`   ✅ PASSOU - API retornaria ${allUsers.length} usuários`);
      console.log(`      • ${membersCount} já são membros`);
      console.log(`      • ${nonMembersCount} podem ser convidados`);
      passed++;
    }
  } catch (error) {
    console.log(`   ❌ FALHOU - Erro: ${error}`);
    failed++;
  }

  // Teste 5: Verificar estrutura de colunas
  console.log("\n📝 Teste 5: Verificar colunas dos boards");
  try {
    const boards = await prisma.board.findMany({
      include: {
        columns: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
      },
    });

    let allHaveColumns = true;
    for (const board of boards) {
      if (board.columns.length === 0) {
        console.log(`   ⚠️  Board "${board.title}" não tem colunas`);
        allHaveColumns = false;
      }
    }

    if (allHaveColumns) {
      console.log(`   ✅ PASSOU - Todos os boards têm colunas`);
      boards.forEach((board) => {
        console.log(`      • ${board.title}: ${board.columns.length} colunas`);
        board.columns.forEach((col) => {
          console.log(`        - ${col.title} (ordem: ${col.order})`);
        });
      });
      passed++;
    } else {
      console.log(`   ❌ FALHOU - Alguns boards não têm colunas`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FALHOU - Erro: ${error}`);
    failed++;
  }

  // Teste 6: Verificar que usuários têm senha válida (hash argon2)
  console.log("\n📝 Teste 6: Verificar hashes de senha");
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ["alice@nexma.com", "steve@nexma.com", "daniel@nexma.com"],
        },
      },
      select: { email: true, passwordHash: true },
    });

    let allHaveHash = true;
    for (const user of users) {
      // Argon2 hash começa com $argon2
      if (!user.passwordHash.startsWith("$argon2")) {
        console.log(`   ⚠️  ${user.email} não tem hash argon2 válido`);
        allHaveHash = false;
      }
    }

    if (allHaveHash && users.length > 0) {
      console.log(`   ✅ PASSOU - ${users.length} usuários têm hashes válidos`);
      passed++;
    } else {
      console.log(`   ❌ FALHOU - Problemas com hashes de senha`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FALHOU - Erro: ${error}`);
    failed++;
  }

  // Resumo
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMO DOS TESTES\n");
  console.log(`✅ Passaram: ${passed}`);
  console.log(`❌ Falharam: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log("\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.");
  } else {
    console.log("\n⚠️  Alguns testes falharam. Revise os erros acima.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro fatal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });