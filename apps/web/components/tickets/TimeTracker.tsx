"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface TimeTrackerProps {
    ticketId: string;
    actualHours: number;
    estimatedHours: number | null;
    onUpdate: () => void;
}

export function TimeTracker({ ticketId, actualHours, estimatedHours, onUpdate }: TimeTrackerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [hours, setHours] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/tickets/${ticketId}/time-entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hours: parseFloat(hours),
                    description,
                }),
            });

            if (res.ok) {
                toast.success("Horas registradas!");
                setIsAdding(false);
                setHours("");
                setDescription("");
                onUpdate();
            } else {
                toast.error("Erro ao registrar horas");
            }
        } catch (err) {
            toast.error("Erro de conexão");
        } finally {
            setLoading(false);
        }
    }

    const progress = estimatedHours ? Math.min((actualHours / estimatedHours) * 100, 100) : 0;
    const isOverBudget = estimatedHours && actualHours > estimatedHours;

    return (
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Clock className="w-4 h-4" />
                    <span>Rastreamento de Tempo</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Registrar
                </Button>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">
                        {actualHours}h registradas
                    </span>
                    {estimatedHours && (
                        <span className={isOverBudget ? "text-red-600 font-bold" : "text-neutral-500"}>
                            de {estimatedHours}h estimadas
                        </span>
                    )}
                </div>
                {estimatedHours && (
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${isOverBudget ? "bg-red-500" : "bg-blue-500"}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="space-y-3 bg-white p-3 rounded border border-neutral-200 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="hours" className="text-xs">Horas</Label>
                            <Input
                                id="hours"
                                type="number"
                                step="0.1"
                                min="0.1"
                                placeholder="0.0"
                                className="h-8 text-sm"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="desc" className="text-xs">Descrição (Opcional)</Label>
                            <Input
                                id="desc"
                                placeholder="O que foi feito?"
                                className="h-8 text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setIsAdding(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
