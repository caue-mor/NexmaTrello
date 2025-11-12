"use client";

import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from "@/components/ui/alert-1";
import { getAlertMessage, getAlertVariant, TaskAlert } from "@/lib/task-status";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

interface TaskAlertsProps {
  overdueCards: TaskAlert[];
  dueTodayCards: TaskAlert[];
  dueSoonCards: TaskAlert[];
  showBoardInfo?: boolean; // Se true, mostra nome do board e coluna
}

export function TaskAlerts({
  overdueCards,
  dueTodayCards,
  dueSoonCards,
  showBoardInfo = true,
}: TaskAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const visibleOverdue = overdueCards.filter((card) => !dismissedIds.has(card.id));
  const visibleDueToday = dueTodayCards.filter((card) => !dismissedIds.has(card.id));
  const visibleDueSoon = dueSoonCards.filter((card) => !dismissedIds.has(card.id));

  const hasAlerts = visibleOverdue.length > 0 || visibleDueToday.length > 0 || visibleDueSoon.length > 0;

  if (!hasAlerts) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence mode="popLayout">
        {/* Tarefas Atrasadas (maior prioridade) */}
        {visibleOverdue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", duration: 0.4 }}
            key="overdue-section"
          >
            <Alert variant="destructive" appearance="light" close onClose={() => {
              visibleOverdue.forEach(card => handleDismiss(card.id));
            }}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>
                  {visibleOverdue.length === 1
                    ? "1 tarefa atrasada"
                    : `${visibleOverdue.length} tarefas atrasadas`}
                </AlertTitle>
                <AlertDescription>
                  <div className="space-y-1.5 mt-2">
                    {visibleOverdue.slice(0, 3).map((card) => (
                      <div key={card.id} className="text-sm">
                        <Link
                          href={`#card-${card.id}`}
                          className="font-medium hover:underline"
                        >
                          {card.title}
                        </Link>
                        <span className="text-muted-foreground ml-2">
                          {getAlertMessage(card.status, card.daysUntilDue)}
                        </span>
                        {showBoardInfo && card.boardTitle && (
                          <span className="text-xs text-muted-foreground block">
                            {card.boardTitle} {card.columnTitle && `• ${card.columnTitle}`}
                          </span>
                        )}
                      </div>
                    ))}
                    {visibleOverdue.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{visibleOverdue.length - 3} outras tarefas atrasadas
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </AlertContent>
            </Alert>
          </motion.div>
        )}

        {/* Tarefas que Vencem Hoje */}
        {visibleDueToday.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", duration: 0.4, delay: 0.05 }}
            key="due-today-section"
          >
            <Alert variant="warning" appearance="light" close onClose={() => {
              visibleDueToday.forEach(card => handleDismiss(card.id));
            }}>
              <AlertIcon>
                <AlertTriangle />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>
                  {visibleDueToday.length === 1
                    ? "1 tarefa vence hoje"
                    : `${visibleDueToday.length} tarefas vencem hoje`}
                </AlertTitle>
                <AlertDescription>
                  <div className="space-y-1.5 mt-2">
                    {visibleDueToday.slice(0, 3).map((card) => (
                      <div key={card.id} className="text-sm">
                        <Link
                          href={`#card-${card.id}`}
                          className="font-medium hover:underline"
                        >
                          {card.title}
                        </Link>
                        {showBoardInfo && card.boardTitle && (
                          <span className="text-xs text-muted-foreground block">
                            {card.boardTitle} {card.columnTitle && `• ${card.columnTitle}`}
                          </span>
                        )}
                      </div>
                    ))}
                    {visibleDueToday.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{visibleDueToday.length - 3} outras tarefas vencem hoje
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </AlertContent>
            </Alert>
          </motion.div>
        )}

        {/* Tarefas que Vencem em Breve (até 3 dias) */}
        {visibleDueSoon.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", duration: 0.4, delay: 0.1 }}
            key="due-soon-section"
          >
            <Alert variant="warning" appearance="outline" close onClose={() => {
              visibleDueSoon.forEach(card => handleDismiss(card.id));
            }}>
              <AlertIcon>
                <Clock />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>
                  {visibleDueSoon.length === 1
                    ? "1 tarefa vence em breve"
                    : `${visibleDueSoon.length} tarefas vencem em breve`}
                </AlertTitle>
                <AlertDescription>
                  <div className="space-y-1.5 mt-2">
                    {visibleDueSoon.slice(0, 3).map((card) => (
                      <div key={card.id} className="text-sm">
                        <Link
                          href={`#card-${card.id}`}
                          className="font-medium hover:underline"
                        >
                          {card.title}
                        </Link>
                        <span className="text-muted-foreground ml-2">
                          {getAlertMessage(card.status, card.daysUntilDue)}
                        </span>
                        {showBoardInfo && card.boardTitle && (
                          <span className="text-xs text-muted-foreground block">
                            {card.boardTitle} {card.columnTitle && `• ${card.columnTitle}`}
                          </span>
                        )}
                      </div>
                    ))}
                    {visibleDueSoon.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{visibleDueSoon.length - 3} outras tarefas vencem em breve
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </AlertContent>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
