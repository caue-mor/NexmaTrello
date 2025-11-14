/**
 * Script de teste de gamificação
 * Testa o sistema de XP, achievements e stats
 */

import { PrismaClient } from "@prisma/client";
import { awardXp } from "../lib/gamification/award-xp";
import { getLevelProgress } from "../lib/gamification/xp-system";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Iniciando testes de gamificação...\n");

  try {
    // 1. Encontrar um usuário para testar
    const user = await prisma.user.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        stats: true,
      },
    });

    if (!user) {
      console.log("❌ Nenhum usuário encontrado!");
      return;
    }

    console.log(`✅ Usuário de teste: ${user.name || user.email}`);
    console.log(`   ID: ${user.id}\n`);

    // 2. Verificar stats iniciais
    console.log("📊 Stats iniciais:");
    if (user.stats) {
      console.log(`   Nível: ${user.stats.level}`);
      console.log(`   XP: ${user.stats.xp}`);
      console.log(`   Moedas: ${user.stats.coins}`);
      console.log(`   Tarefas: ${user.stats.tasksCompleted}\n`);
    } else {
      console.log("   ⚠️  Usuário não tem stats ainda\n");
    }

    // 3. Testar award de XP (completar checklist item)
    console.log("🎮 Testando award de XP (checklist_item)...");
    const result = await awardXp(user.id, "checklist_item", {
      cardUrgency: "MEDIUM",
    });

    console.log(`   ✅ XP ganho: +${result.xpGained}`);
    console.log(`   Moedas ganhas: +${result.coinsGained}`);

    if (result.leveledUp) {
      console.log(`   🎉 SUBIU DE NÍVEL! ${result.oldLevel} → ${result.newLevel}`);
    }

    if (result.newAchievements && result.newAchievements.length > 0) {
      console.log(`   🏆 Achievements desbloqueados: ${result.newAchievements.length}`);
      result.newAchievements.forEach(key => {
        console.log(`      - ${key}`);
      });
    }
    console.log("");

    // 4. Verificar stats após award
    const updatedStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    if (updatedStats) {
      console.log("📊 Stats após award:");
      console.log(`   Nível: ${updatedStats.level}`);
      console.log(`   XP: ${updatedStats.xp}`);
      console.log(`   Moedas: ${updatedStats.coins}`);
      console.log(`   Tarefas: ${updatedStats.tasksCompleted}`);

      const progress = getLevelProgress(updatedStats.xp);
      console.log(`   Progresso: ${progress.currentLevelXp}/${progress.xpForNextLevel} XP (${Math.round(progress.progress)}%)\n`);
    }

    // 5. Verificar achievements
    const achievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
    });

    console.log(`🏆 Achievements desbloqueados: ${achievements.length}`);
    achievements.forEach(ach => {
      console.log(`   - ${ach.achievementKey}`);
    });

    console.log("\n✅ Teste de gamificação concluído com sucesso!");

  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
