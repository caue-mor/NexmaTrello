/**
 * Ticket Metrics - Funções para calcular métricas de tempo e SLA
 */

import { differenceInMinutes, differenceInHours, differenceInDays, formatDuration, intervalToDuration } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TicketMetrics {
    responseTime: number | null; // Em minutos
    resolutionTime: number | null; // Em horas
    totalTime: number | null; // Em horas
    isOverdue: boolean;
    slaViolated: boolean;
    status: "open" | "in_progress" | "resolved" | "closed";
}

/**
 * Calcula o tempo de resposta (criação → início do atendimento)
 */
export function calculateResponseTime(createdAt: Date, startedAt: Date | null): number | null {
    if (!startedAt) return null;
    return differenceInMinutes(startedAt, createdAt);
}

/**
 * Calcula o tempo de resolução (criação → resolução)
 */
export function calculateResolutionTime(createdAt: Date, resolvedAt: Date | null): number | null {
    if (!resolvedAt) return null;
    return differenceInHours(resolvedAt, createdAt);
}

/**
 * Calcula o tempo total (criação → fechamento)
 */
export function calculateTotalTime(createdAt: Date, closedAt: Date | null): number | null {
    if (!closedAt) return null;
    return differenceInHours(closedAt, createdAt);
}

/**
 * Verifica se o ticket está atrasado (passou do prazo)
 */
export function isTicketOverdue(dueDate: Date | null, status: string): boolean {
    if (!dueDate || status === "CLOSED") return false;
    return new Date() > dueDate;
}

/**
 * Verifica se houve violação de SLA
 */
export function checkSLAViolation(slaDeadline: Date | null, resolvedAt: Date | null, status: string): boolean {
    if (!slaDeadline) return false;

    // Se ainda não foi resolvido e já passou do prazo
    if (!resolvedAt && status !== "CLOSED") {
        return new Date() > slaDeadline;
    }

    // Se foi resolvido depois do prazo
    if (resolvedAt) {
        return resolvedAt > slaDeadline;
    }

    return false;
}

/**
 * Formata duração em formato legível
 */
export function formatTimeDuration(minutes: number | null): string {
    if (minutes === null) return "N/A";

    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
        return `${hours.toFixed(1)} h`;
    }

    const days = hours / 24;
    return `${days.toFixed(1)} dias`;
}

/**
 * Formata duração em horas
 */
export function formatHoursDuration(hours: number | null): string {
    if (hours === null) return "N/A";

    if (hours < 24) {
        return `${hours.toFixed(1)} h`;
    }

    const days = hours / 24;
    return `${days.toFixed(1)} dias`;
}

/**
 * Calcula todas as métricas de um ticket
 */
export function calculateTicketMetrics(ticket: {
    createdAt: Date;
    startedAt: Date | null;
    resolvedAt: Date | null;
    closedAt: Date | null;
    dueDate: Date | null;
    slaDeadline: Date | null;
    status: string;
}): TicketMetrics {
    const responseTime = calculateResponseTime(ticket.createdAt, ticket.startedAt);
    const resolutionTime = calculateResolutionTime(ticket.createdAt, ticket.resolvedAt);
    const totalTime = calculateTotalTime(ticket.createdAt, ticket.closedAt);
    const isOverdue = isTicketOverdue(ticket.dueDate, ticket.status);
    const slaViolated = checkSLAViolation(ticket.slaDeadline, ticket.resolvedAt, ticket.status);

    let status: "open" | "in_progress" | "resolved" | "closed" = "open";
    if (ticket.status === "CLOSED") status = "closed";
    else if (ticket.status === "RESOLVED") status = "resolved";
    else if (ticket.status === "IN_PROGRESS") status = "in_progress";

    return {
        responseTime,
        resolutionTime,
        totalTime,
        isOverdue,
        slaViolated,
        status,
    };
}

/**
 * Calcula SLA deadline baseado na prioridade
 */
export function calculateSLADeadline(createdAt: Date, priority: string): Date {
    const deadline = new Date(createdAt);

    switch (priority) {
        case "CRITICAL":
            deadline.setHours(deadline.getHours() + 2); // 2 horas
            break;
        case "URGENT":
            deadline.setHours(deadline.getHours() + 4); // 4 horas
            break;
        case "HIGH":
            deadline.setHours(deadline.getHours() + 24); // 1 dia
            break;
        case "MEDIUM":
            deadline.setDate(deadline.getDate() + 3); // 3 dias
            break;
        case "LOW":
            deadline.setDate(deadline.getDate() + 7); // 7 dias
            break;
        default:
            deadline.setDate(deadline.getDate() + 3); // 3 dias (padrão)
    }

    return deadline;
}
