"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Trash2, ArrowRight } from "lucide-react";
import { AutomationBuilder } from "./AutomationBuilder";
import { toast } from "sonner";

interface Automation {
    id: string;
    name: string;
    triggerType: string;
    actionType: string;
    isActive: boolean;
}

interface AutomationDialogProps {
    boardId: string;
}

export function AutomationDialog({ boardId }: AutomationDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"list" | "create">("list");
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAutomations = () => {
        setLoading(true);
        fetch(`/api/boards/${boardId}/automations`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setAutomations(data);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isOpen && view === "list") {
            fetchAutomations();
        }
    }, [isOpen, view, boardId]);

    const handleDelete = async (id: string) => {
        try {
            // TODO: Implement DELETE endpoint
            // For now just optimistic update
            setAutomations((prev) => prev.filter((a) => a.id !== id));
            toast.success("Automação removida");
        } catch (error) {
            toast.error("Erro ao remover automação");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="hidden sm:inline">Automações</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Automações do Quadro</DialogTitle>
                    <DialogDescription>
                        Crie regras para automatizar tarefas repetitivas.
                    </DialogDescription>
                </DialogHeader>

                {view === "list" ? (
                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-sm text-neutral-500">
                                {automations.length} automações ativas
                            </h3>
                            <Button onClick={() => setView("create")} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Automação
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-neutral-500">
                                Carregando...
                            </div>
                        ) : automations.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-neutral-50">
                                <Zap className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                <h3 className="font-medium text-neutral-900">
                                    Nenhuma automação criada
                                </h3>
                                <p className="text-sm text-neutral-500 mt-1 mb-4">
                                    Comece criando sua primeira regra de automação.
                                </p>
                                <Button onClick={() => setView("create")}>
                                    Criar Automação
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {automations.map((auto) => (
                                    <div
                                        key={auto.id}
                                        className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-blue-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-yellow-50 rounded-lg">
                                                <Zap className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-neutral-900">
                                                    {auto.name}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                                    <span>{auto.triggerType}</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span>{auto.actionType}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-neutral-400 hover:text-red-600"
                                            onClick={() => handleDelete(auto.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <AutomationBuilder
                        boardId={boardId}
                        onSave={() => {
                            setView("list");
                            fetchAutomations();
                        }}
                        onCancel={() => setView("list")}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
