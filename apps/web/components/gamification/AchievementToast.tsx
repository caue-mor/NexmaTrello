"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementToastProps {
  achievement: {
    title: string;
    description: string;
    icon: string;
    xpReward: number;
  };
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  const IconComponent =
    LucideIcons[
      achievement.icon as keyof typeof LucideIcons
    ] as LucideIcons.LucideIcon;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-xl overflow-hidden max-w-md"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          {IconComponent && <IconComponent className="w-7 h-7 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-orange-800">
              🎉 Conquista Desbloqueada!
            </span>
          </div>

          <h4 className="font-bold text-neutral-900 text-base mb-1">
            {achievement.title}
          </h4>

          <p className="text-sm text-neutral-700 mb-2">
            {achievement.description}
          </p>

          {/* XP Badge */}
          <div className="inline-flex items-center gap-1 bg-yellow-200 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-yellow-700">
              +{achievement.xpReward} XP
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
