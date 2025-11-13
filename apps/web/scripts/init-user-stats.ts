/**
 * Initialize UserStats for all existing users
 *
 * Run with: npm run init:stats
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎮 Initializing gamification stats for all users...\n');

  // Get all active users
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      stats: true,
    },
  });

  console.log(`Found ${users.length} active users\n`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.stats) {
      console.log(`⏭️  Skipping ${user.name || user.email} - already has stats`);
      skipped++;
      continue;
    }

    try {
      await prisma.userStats.create({
        data: {
          userId: user.id,
          level: 1,
          xp: 0,
          coins: 0,
          currentStreak: 0,
          longestStreak: 0,
          tasksCompleted: 0,
          tasksCompletedOnTime: 0,
          cardsCompleted: 0,
          cardsCompletedOnTime: 0,
          criticalCardsCompleted: 0,
        },
      });

      console.log(`✅ Created stats for ${user.name || user.email}`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create stats for ${user.name || user.email}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${users.length}`);
  console.log('\n✨ Done!\n');
}

main()
  .catch((error) => {
    console.error('❌ Error initializing user stats:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });