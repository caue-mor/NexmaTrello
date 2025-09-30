import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando apenas usuários (sem adicionar aos boards)...");

  // Senha padrão para todos os usuários de teste
  const password = "senha123";
  const hashedPassword = await argon2.hash(password);

  // Lista de usuários de teste
  const users = [
    { email: "alice@nexma.com", name: "Alice Silva", passwordHash: hashedPassword },
    { email: "bob@nexma.com", name: "Bob Santos", passwordHash: hashedPassword },
    { email: "carol@nexma.com", name: "Carol Oliveira", passwordHash: hashedPassword },
    { email: "david@nexma.com", name: "David Costa", passwordHash: hashedPassword },
    { email: "eva@nexma.com", name: "Eva Ferreira", passwordHash: hashedPassword },
    { email: "daniel@nexma.com", name: "Daniel", passwordHash: hashedPassword },
    { email: "carlos@nexma.com", name: "Carlos", passwordHash: hashedPassword },
    { email: "caue@nexma.com", name: "Cauê", passwordHash: hashedPassword },
    { email: "whanderson@nexma.com", name: "Whanderson", passwordHash: hashedPassword },
    { email: "steve@nexma.com", name: "Steve", passwordHash: hashedPassword },
    { email: "patrik@nexma.com", name: "Patrik", passwordHash: hashedPassword },
  ];

  console.log("👥 Criando/atualizando usuários...");

  for (const user of users) {
    try {
      const created = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
      console.log(`✅ ${created.email} - ${created.name}`);
    } catch (error) {
      console.error(`❌ Erro ao criar ${user.email}:`, error);
    }
  }

  console.log("\n✨ Usuários criados com sucesso!");
  console.log("\n📝 Credenciais:");
  console.log("   Email: [nome]@nexma.com");
  console.log("   Senha: senha123");
  console.log("\n💡 Use o botão 'Convidar' nos boards para adicionar esses usuários!");
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