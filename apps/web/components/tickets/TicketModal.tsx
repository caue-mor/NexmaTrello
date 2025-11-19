"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TicketTimeline } from "./TicketTimeline";
import { TimeTracker } from "./TimeTracker";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, User as UserIcon, Calendar, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AssigneeSelector } from "@/components/boards/AssigneeSelector"; // Reutilizando se possível, ou criar novo

interface TicketModalProps {
    ticketId: string;
    onClose: () => void;
}

export function TicketModal({ ticketId, onClose }: TicketModalProps) {
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        loadTicket();
    }, [ticketId]);

    async function loadTicket() {
        try {
            const res = await fetch(`/api/tickets/${ticketId}`);
            const data = await res.json();
            if (res.ok) {
                setTicket(data.ticket);
            } else {
                toast.error("Erro ao carregar ticket");
                onClose();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(action: "resolve" | "close" | "reopen") {
        try {
            let endpoint = "";
            let method = "POST";
            let body = {};

            if (action === "resolve") endpoint = `/api/tickets/${ticketId}/resolve`;
            else if (action === "close") endpoint = `/api/tickets/${ticketId}/close`;
            else {
                // Reopen logic (update status to OPEN)
                endpoint = `/api/tickets/${ticketId}`;
                method = "PUT";
                body = { status: "OPEN" }; // Simplificado, idealmente teria rota específica
            }

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: method === "PUT" ? JSON.stringify(body) : undefined,
            });

            if (res.ok) {
                toast.success(`Ticket ${action === "resolve" ? "resolvido" : action === "close" ? "fechado" : "reaberto"}!`);
                loadTicket();
            } else {
                toast.error("Erro ao atualizar status");
            }
        } catch (err) {
            toast.error("Erro de conexão");
        }
    }

    async function handleAssign(userId: string | null) {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (res.ok) {
                toast.success("Atribuição atualizada!");
                setIsAssigning(false);
                loadTicket();
            } else {
                toast.error("Erro ao atribuir");
            }
        } catch (err) {
            toast.error("Erro de conexão");
        }
    }

    if (loading || !ticket) {
        return null; // Ou loading spinner
    }

    const isSlaViolated = ticket.slaViolated || (ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED");

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b bg-neutral-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-neutral-500">#{ticket.ticketNumber}</span>
                            <Badge variant={ticket.status === "RESOLVED" ? "default" : "outline"}>
                                {ticket.status}
                            </Badge>
                            <Badge variant="secondary" className={ticket.priority === "CRITICAL" ? "bg-red-100 text-red-700" : ""}>
                                {ticket.priority}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                                <Button size="sm" onClick={() => handleStatusChange("resolve")} className="bg-green-600 hover:bg-green-700 text-white">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Resolver
                                </Button>
                            )}
                            {ticket.status === "RESOLVED" && (
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange("close")}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Fechar
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogTitle className="text-xl font-bold">{ticket.title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div className="prose prose-sm max-w-none">
                            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Descrição</h3>
                            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 min-h-[100px]">
                                {ticket.description || <span className="text-neutral-400 italic">Sem descrição</span>}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">Histórico</h3>
                            <TicketTimeline history={ticket.history} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l bg-neutral-50/30 p-6 space-y-6 overflow-y-auto">
                        {/* SLA Alert */}
                        {isSlaViolated && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 text-red-800">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">SLA Violado</p>
                                    <p className="text-xs mt-1">Este ticket excedeu o prazo de resolução.</p>
                                </div>
                            </div>
                        )}

                        {/* Assignee */}
                        <div>
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Responsável</h4>
                            {isAssigning ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Digite email..."
                                        className="w-full text-sm border rounded p-1"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAssign(e.currentTarget.value); // Simplificado, idealmente usaria AssigneeSelector
                                        }}
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => setIsAssigning(false)} className="w-full">Cancelar</Button>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center gap-2 p-2 rounded hover:bg-neutral-100 cursor-pointer transition-colors"
                                    onClick={() => setIsAssigning(true)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                                        {ticket.assignedTo ? (
                                            <span className="font-medium text-sm">{(ticket.assignedTo.name || ticket.assignedTo.email)[0].toUpperCase()}</span>
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-neutral-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {ticket.assignedTo ? (ticket.assignedTo.name || ticket.assignedTo.email) : "Sem responsável"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Dates */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Datas</h4>
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <Calendar className="w-4 h-4 text-neutral-400" />
                                <span>Criado em {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            {ticket.slaDeadline && (
                                <div className={`flex items-center gap-2 text-sm ${isSlaViolated ? "text-red-600 font-medium" : "text-neutral-600"}`}>
                                    <Clock className="w-4 h-4 text-neutral-400" />
                                    <span>SLA: {new Date(ticket.slaDeadline).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Time Tracking */}
                        <TimeTracker
                            ticketId={ticketId}
                            actualHours={ticket.actualHours || 0}
                            estimatedHours={ticket.estimatedHours}
                            onUpdate={loadTicket}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
