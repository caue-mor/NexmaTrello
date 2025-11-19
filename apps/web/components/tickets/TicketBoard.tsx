"use client";

import { useState, useEffect } from "react";
import { TicketCard } from "./TicketCard";
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
    createdAt: string;
}

const COLUMNS = [
    { id: "OPEN", title: "Aberto", color: "border-t-blue-500" },
    { id: "IN_PROGRESS", title: "Em Andamento", color: "border-t-yellow-500" },
    { id: "WAITING", title: "Aguardando", color: "border-t-purple-500" },
    { id: "RESOLVED", title: "Resolvido", color: "border-t-green-500" },
];

export function TicketBoard({ boardId }: { boardId?: string }) {
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
        <div className="h-full overflow-x-auto">
            <div className="flex gap-4 h-full min-w-max pb-4">
                {COLUMNS.map((column) => {
                    const columnTickets = tickets.filter((t) => t.status === column.id);

                    return (
                        <div key={column.id} className="w-80 flex flex-col h-full">
                            <div className={`bg-neutral-50 p-3 rounded-t-lg border-t-4 ${column.color} border-x border-b border-neutral-200 mb-2 flex justify-between items-center`}>
                                <h3 className="font-semibold text-sm text-neutral-700">{column.title}</h3>
                                <span className="bg-neutral-200 text-neutral-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {columnTickets.length}
                                </span>
                            </div>

                            <div className="flex-1 bg-neutral-50/50 rounded-b-lg border border-neutral-200 p-2 overflow-y-auto space-y-2">
                                {columnTickets.length > 0 ? (
                                    columnTickets.map((ticket) => (
                                        <TicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            onClick={() => setSelectedTicketId(ticket.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-xs text-neutral-400 border-2 border-dashed border-neutral-200 rounded-lg">
                                        Nenhum ticket
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedTicketId && (
                <TicketModal
                    ticketId={selectedTicketId}
                    onClose={() => {
                        setSelectedTicketId(null);
                        loadTickets(); // Recarregar ao fechar para atualizar status
                    }}
                />
            )}
        </div>
    );
}
