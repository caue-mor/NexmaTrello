"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface InviteToastProps {
  invite: {
    id: string;
    boardId: string;
    boardTitle: string;
    inviterName: string | null;
    inviterEmail: string;
    createdAt: Date | string;
  };
  onAccept: (inviteId: string) => Promise<void>;
  onDecline: (inviteId: string) => Promise<void>;
  onClose: () => void;
}

export function InviteToast({
  invite,
  onAccept,
  onDecline,
  onClose,
}: InviteToastProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  async function handleAccept() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onAccept(invite.id);
      handleClose();
    } catch (err) {
      console.error("Error accepting invite:", err);
      setIsLoading(false);
    }
  }

  async function handleDecline() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onDecline(invite.id);
      handleClose();
    } catch (err) {
      console.error("Error declining invite:", err);
      setIsLoading(false);
    }
  }

  function handleClose() {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }

  const timeAgo = getTimeAgo(new Date(invite.createdAt));
  const inviterDisplay = invite.inviterName || invite.inviterEmail;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{ type: "spring", duration: 0.5 }}
      className={cn(
        "relative bg-white dark:bg-neutral-900 border-2 border-blue-200",
        "shadow-2xl rounded-2xl p-4 min-w-[380px] max-w-md",
        isClosing && "pointer-events-none"
      )}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-12 w-12 flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {inviterDisplay.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-900" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                🎉 Convite para Grupo
              </p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-medium">{inviterDisplay}</span> convidou
                você para o grupo{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {invite.boardTitle}
                </span>
              </p>
            </div>
          </div>

          {/* Time */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {timeAgo}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleDecline}
              disabled={isLoading}
              className={cn(
                "flex-1 rounded-lg flex items-center justify-center gap-2 px-4 py-2",
                "bg-neutral-100 hover:bg-red-100 dark:bg-neutral-800 dark:hover:bg-red-950/50",
                "text-neutral-700 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400",
                "text-sm font-medium transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <X className="h-4 w-4" />
              Recusar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleAccept}
              disabled={isLoading}
              className={cn(
                "flex-1 rounded-lg flex items-center justify-center gap-2 px-4 py-2",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                "text-white text-sm font-medium shadow-md hover:shadow-lg",
                "transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Check className="h-4 w-4" />
              {isLoading ? "Aceitando..." : "Aceitar"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Agora mesmo";
  if (seconds < 3600)
    return `Há ${Math.floor(seconds / 60)} ${Math.floor(seconds / 60) === 1 ? "minuto" : "minutos"}`;
  if (seconds < 86400)
    return `Há ${Math.floor(seconds / 3600)} ${Math.floor(seconds / 3600) === 1 ? "hora" : "horas"}`;
  return `Há ${Math.floor(seconds / 86400)} ${Math.floor(seconds / 86400) === 1 ? "dia" : "dias"}`;
}
