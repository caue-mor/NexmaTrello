"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Clock, User as UserIcon } from "lucide-react";

interface Ticket {
    id: string;
    ticketNumber: number;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
    status: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | "CANCELLED";
    type: "BUG" | "FEATURE" | "TASK" | "SUPPORT" | "URGENT";
    slaDeadline: string | null;
    slaViolated: boolean;
    assignedTo: {
        name: string | null;
        email: string;
    } | null;
    createdAt: string;
}

interface TicketCardProps {
    ticket: Ticket;
    onClick: () => void;
}

const priorityColors = {
    LOW: "bg-blue-100 text-blue-700 border-blue-200",
    MEDIUM: "bg-green-100 text-green-700 border-green-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    URGENT: "bg-red-100 text-red-700 border-red-200",
    CRITICAL: "bg-purple-100 text-purple-700 border-purple-200 animate-pulse",
};

const typeIcons = {
    BUG: "🐛",
    FEATURE: "✨",
    TASK: "📋",
    SUPPORT: "🆘",
    URGENT: "🔥",
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
    const isSlaNear = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
    const isSlaViolated = ticket.slaViolated || (ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date());

    return (
        <div
            onClick={onClick}
            className={`bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${isSlaViolated && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED"
                    ? "border-red-300 ring-1 ring-red-200"
                    : "border-neutral-200"
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-500">#{ticket.ticketNumber}</span>
                    <span className="text-xs" title={ticket.type}>
                        {typeIcons[ticket.type]}
                    </span>
                </div>
                <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[ticket.priority]
                        }`}
                >
                    {ticket.priority}
                </span>
            </div>

            <h4 className="font-medium text-sm text-neutral-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {ticket.title}
            </h4>

            <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                    {ticket.assignedTo ? (
                        <div className="flex items-center gap-1" title={`Atribuído a: ${ticket.assignedTo.name || ticket.assignedTo.email}`}>
                            <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
                                <span className="text-[10px] font-medium">
                                    {(ticket.assignedTo.name || ticket.assignedTo.email)[0].toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-neutral-400">
                            <UserIcon className="w-3 h-3" />
                            <span>Sem dono</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {ticket.slaDeadline && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                        <div
                            className={`flex items-center gap-1 ${isSlaViolated
                                    ? "text-red-600 font-bold"
                                    : isSlaNear
                                        ? "text-orange-600 font-medium"
                                        : "text-neutral-400"
                                }`}
                            title={`SLA: ${new Date(ticket.slaDeadline).toLocaleString()}`}
                        >
                            <Clock className="w-3 h-3" />
                            <span>
                                {isSlaViolated ? "SLA Violado" : formatDistanceToNow(new Date(ticket.slaDeadline), { locale: ptBR, addSuffix: true })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
