"use client";

import { useState } from "react";
import { TicketBoard } from "@/components/tickets/TicketBoard";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketForm } from "@/components/tickets/TicketForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LayoutGrid, List, Plus } from "lucide-react";

export default function TicketsPage() {
    const [viewMode, setViewMode] = useState<"board" | "list">("board");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Central de Tickets</h1>
                    <p className="text-neutral-500">Gerencie seus chamados e tarefas de todos os projetos</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                        <button
                            onClick={() => setViewMode("board")}
                            className={`p-2 rounded-md transition-all ${viewMode === "board" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
                                }`}
                            title="Visualização em Quadro"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
                                }`}
                            title="Visualização em Lista"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Ticket
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {viewMode === "board" ? (
                    <TicketBoard />
                ) : (
                    <TicketList />
                )}
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl p-0">
                    <TicketForm
                        onSuccess={() => {
                            setIsCreateModalOpen(false);
                            // Idealmente recarregar os dados aqui, mas o componente filho fará fetch no mount
                            window.location.reload(); // Solução temporária simples para refresh
                        }}
                        onCancel={() => setIsCreateModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
