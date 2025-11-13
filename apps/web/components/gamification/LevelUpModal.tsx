"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Coins } from "lucide-react";
import Confetti from "react-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: number;
  coins: number;
}

export function LevelUpModal({
  open,
  onOpenChange,
  level,
  coins,
}: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden border-none bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.3}
              />
            </div>
          )}
        </AnimatePresence>

        <DialogHeader>
          <DialogTitle className="sr-only">Level Up!</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Animated Trophy */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            {/* Sparkles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-2 -left-2"
            >
              <Sparkles className="w-6 h-6 text-purple-500" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              Subiu de Nível!
            </h2>
            <p className="text-neutral-600">Parabéns pelo seu progresso!</p>
          </motion.div>

          {/* Level Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-center"
          >
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
              {level}
            </div>
          </motion.div>

          {/* Coins Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-2 bg-yellow-100 px-6 py-3 rounded-full border-2 border-yellow-300"
          >
            <Coins className="w-6 h-6 text-yellow-600" />
            <span className="text-lg font-bold text-yellow-700">
              +{coins} moedas
            </span>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full"
          >
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
              size="lg"
            >
              Continuar
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
