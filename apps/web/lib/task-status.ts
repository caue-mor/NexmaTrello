import { Card } from "@prisma/client";

export type TaskStatus = "overdue" | "due-today" | "due-soon" | "upcoming" | "on-time";

export interface TaskAlert {
  id: string;
  title: string;
  dueAt: Date;
  status: TaskStatus;
  daysUntilDue: number;
  boardTitle?: string;
  columnTitle?: string;
}

/**
 * Calcula o status de uma tarefa baseado na data de vencimento
 */
export function getTaskStatus(dueAt: Date | null, completedAt: Date | null): TaskStatus | null {
  if (!dueAt || completedAt) return null;

  const now = new Date();
  const due = new Date(dueAt);
  const diffInMs = due.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) return "overdue"; // Atrasada
  if (diffInDays === 0) return "due-today"; // Vence hoje
  if (diffInDays <= 3) return "due-soon"; // Vence em até 3 dias
  if (diffInDays <= 7) return "upcoming"; // Vence em até 7 dias
  return "on-time"; // Dentro do prazo
}

/**
 * Calcula quantos dias faltam para o vencimento
 */
export function getDaysUntilDue(dueAt: Date): number {
  const now = new Date();
  const due = new Date(dueAt);
  const diffInMs = due.getTime() - now.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Formata mensagem de alerta baseado no status
 */
export function getAlertMessage(status: TaskStatus, daysUntilDue: number): string {
  switch (status) {
    case "overdue":
      const overdueDays = Math.abs(daysUntilDue);
      return overdueDays === 1
        ? "Atrasada há 1 dia"
        : `Atrasada há ${overdueDays} dias`;
    case "due-today":
      return "Vence hoje";
    case "due-soon":
      return daysUntilDue === 1
        ? "Vence amanhã"
        : `Vence em ${daysUntilDue} dias`;
    case "upcoming":
      return `Vence em ${daysUntilDue} dias`;
    default:
      return "Dentro do prazo";
  }
}

/**
 * Retorna variante do alerta baseado no status
 */
export function getAlertVariant(status: TaskStatus): "destructive" | "warning" | "info" {
  switch (status) {
    case "overdue":
      return "destructive";
    case "due-today":
    case "due-soon":
      return "warning";
    default:
      return "info";
  }
}

/**
 * Agrupa cards por status de alerta
 */
export function groupCardsByStatus(
  cards: Array<Card & { board?: { title: string }; column?: { title: string } }>
): Map<TaskStatus, TaskAlert[]> {
  const grouped = new Map<TaskStatus, TaskAlert[]>();

  cards.forEach((card) => {
    const status = getTaskStatus(card.dueAt, card.completedAt);
    if (!status) return; // Ignora cards sem dueAt ou já completos

    // Só mostra alertas para overdue, due-today e due-soon
    if (status !== "overdue" && status !== "due-today" && status !== "due-soon") {
      return;
    }

    const alert: TaskAlert = {
      id: card.id,
      title: card.title,
      dueAt: card.dueAt!,
      status,
      daysUntilDue: getDaysUntilDue(card.dueAt!),
      boardTitle: card.board?.title,
      columnTitle: card.column?.title,
    };

    if (!grouped.has(status)) {
      grouped.set(status, []);
    }
    grouped.get(status)!.push(alert);
  });

  return grouped;
}

/**
 * Conta quantas tarefas precisam de atenção
 */
export function getAlertsCount(
  cards: Array<Pick<Card, "dueAt" | "completedAt">>
): { overdue: number; dueToday: number; dueSoon: number; total: number } {
  let overdue = 0;
  let dueToday = 0;
  let dueSoon = 0;

  cards.forEach((card) => {
    const status = getTaskStatus(card.dueAt, card.completedAt);
    if (status === "overdue") overdue++;
    if (status === "due-today") dueToday++;
    if (status === "due-soon") dueSoon++;
  });

  return {
    overdue,
    dueToday,
    dueSoon,
    total: overdue + dueToday + dueSoon,
  };
}
