"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketModal } from "./TicketModal";

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
    requester: {
        name: string | null;
        email: string;
    };
    createdAt: string;
}

const priorityColors = {
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-green-100 text-green-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
    CRITICAL: "bg-purple-100 text-purple-700 animate-pulse",
};

const statusColors = {
    OPEN: "bg-blue-50 text-blue-600 border-blue-200",
    IN_PROGRESS: "bg-yellow-50 text-yellow-600 border-yellow-200",
    WAITING: "bg-purple-50 text-purple-600 border-purple-200",
    RESOLVED: "bg-green-50 text-green-600 border-green-200",
    CLOSED: "bg-neutral-100 text-neutral-600 border-neutral-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const statusLabels = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em Andamento",
    WAITING: "Aguardando",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
    CANCELLED: "Cancelado",
};

export function TicketList({ boardId }: { boardId?: string }) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, [boardId]);

    async function loadTickets() {
        try {
            const url = boardId ? `/api/tickets?boardId=${boardId}` : "/api/tickets";
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setTickets(data.tickets);
            }
        } catch (err) {
            console.error("Erro ao carregar tickets:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-neutral-500">Carregando tickets...</div>;
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-500 font-medium border-b">
                    <tr>
                        <th className="px-4 py-3 w-20">#ID</th>
                        <th className="px-4 py-3">Título</th>
                        <th className="px-4 py-3 w-32">Status</th>
                        <th className="px-4 py-3 w-24">Prioridade</th>
                        <th className="px-4 py-3 w-40">Atribuído a</th>
                        <th className="px-4 py-3 w-40">Solicitante</th>
                        <th className="px-4 py-3 w-32">Criado há</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {tickets.map((ticket) => (
                        <tr
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="hover:bg-neutral-50 cursor-pointer transition-colors"
                        >
                            <td className="px-4 py-3 font-mono text-neutral-500">#{ticket.ticketNumber}</td>
                            <td className="px-4 py-3 font-medium text-neutral-900">{ticket.title}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[ticket.status]}`}>
                                    {statusLabels[ticket.status]}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityColors[ticket.priority]}`}>
                                    {ticket.priority}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                                {ticket.assignedTo ? (ticket.assignedTo.name || ticket.assignedTo.email) : <span className="text-neutral-400">-</span>}
                            </td>
                            <td className="px-4 py-3 text-neutral-600">
                                {ticket.requester.name || ticket.requester.email}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                                {formatDistanceToNow(new Date(ticket.createdAt), { locale: ptBR, addSuffix: true })}
                            </td>
                        </tr>
                    ))}
                    {tickets.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                                Nenhum ticket encontrado
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {selectedTicketId && (
                <TicketModal
                    ticketId={selectedTicketId}
                    onClose={() => {
                        setSelectedTicketId(null);
                        loadTickets();
                    }}
                />
            )}
        </div>
    );
}
