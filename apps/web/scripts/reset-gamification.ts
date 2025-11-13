/**
 * Reset Gamification - Reseta todos os stats e achievements dos usuários
 *
 * ATENÇÃO: Este script apaga TODOS os dados de gamificação!
 * Use apenas quando quiser começar do zero.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetando sistema de gamificação...\n');

  try {
    // 1. Deletar todos os achievements
    console.log('🗑️  Deletando achievements...');
    const deletedAchievements = await prisma.userAchievement.deleteMany({});
    console.log(`   ✅ ${deletedAchievements.count} achievements deletados\n`);

    // 2. Resetar todos os UserStats
    console.log('🔄 Resetando stats de todos os usuários...');
    const updatedStats = await prisma.userStats.updateMany({
      data: {
        level: 1,
        xp: 0,
        coins: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        tasksCompleted: 0,
        tasksCompletedOnTime: 0,
        cardsCompleted: 0,
        cardsCompletedOnTime: 0,
        criticalCardsCompleted: 0,
      },
    });
    console.log(`   ✅ ${updatedStats.count} usuários resetados\n`);

    // 3. Mostrar resultado
    console.log('📊 Resultado final:');
    console.log(`   - Achievements deletados: ${deletedAchievements.count}`);
    console.log(`   - Usuários resetados: ${updatedStats.count}`);
    console.log('\n✨ Reset completo! Todos começam do zero agora.\n');

    // 4. Verificar estado final
    const users = await prisma.user.findMany({
      include: {
        stats: true,
      },
      take: 5,
    });

    console.log('👥 Primeiros 5 usuários (verificação):');
    users.forEach((user) => {
      console.log(`   - ${user.name || user.email}: Nível ${user.stats?.level || 1}, ${user.stats?.xp || 0} XP`);
    });

  } catch (error) {
    console.error('❌ Erro ao resetar gamificação:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
