"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User as UserIcon, Edit, CheckCircle, XCircle, PlayCircle, Clock } from "lucide-react";

interface HistoryEntry {
    id: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

const actionIcons: Record<string, any> = {
    created: PlayCircle,
    updated: Edit,
    assigned: UserIcon,
    unassigned: UserIcon,
    resolved: CheckCircle,
    closed: XCircle,
};

const actionColors: Record<string, string> = {
    created: "text-blue-500 bg-blue-50",
    updated: "text-orange-500 bg-orange-50",
    assigned: "text-purple-500 bg-purple-50",
    unassigned: "text-neutral-500 bg-neutral-50",
    resolved: "text-green-500 bg-green-50",
    closed: "text-neutral-500 bg-neutral-100",
};

export function TicketTimeline({ history }: { history: HistoryEntry[] }) {
    if (!history || history.length === 0) return null;

    return (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
            {history.map((entry) => {
                const Icon = actionIcons[entry.action] || Edit;
                const colorClass = actionColors[entry.action] || "text-neutral-500 bg-neutral-50";

                return (
                    <div key={entry.id} className="relative flex items-start group is-active">
                        <div className={`absolute left-0 ml-2.5 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-white shadow-sm ${colorClass}`}>
                            <Icon className="w-3 h-3" />
                        </div>
                        <div className="ml-10 w-full">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-neutral-900">
                                    {entry.user.name || entry.user.email}
                                </span>
                                <time className="text-xs text-neutral-500">
                                    {formatDistanceToNow(new Date(entry.createdAt), { locale: ptBR, addSuffix: true })}
                                </time>
                            </div>
                            <div className="text-sm text-neutral-600 bg-white p-3 rounded-lg border border-neutral-100 shadow-sm">
                                {formatHistoryMessage(entry)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function formatHistoryMessage(entry: HistoryEntry) {
    switch (entry.action) {
        case "created":
            return "Criou este ticket";
        case "assigned":
            return `Atribuiu a ${entry.newValue}`;
        case "unassigned":
            return "Removeu a atribuição";
        case "resolved":
            return "Marcou como resolvido";
        case "closed":
            return "Fechou o ticket";
        case "updated":
            if (entry.field === "status") return `Alterou status de ${entry.oldValue} para ${entry.newValue}`;
            if (entry.field === "priority") return `Alterou prioridade de ${entry.oldValue} para ${entry.newValue}`;
            if (entry.field === "type") return `Alterou tipo de ${entry.oldValue} para ${entry.newValue}`;
            if (entry.field === "description") return "Atualizou a descrição";
            if (entry.field === "title") return "Atualizou o título";
            if (entry.field === "dueDate") return `Alterou prazo para ${entry.newValue}`;
            if (entry.field === "estimatedHours") return `Alterou estimativa para ${entry.newValue}h`;
            return `Atualizou ${entry.field}`;
        default:
            return entry.newValue || "Realizou uma ação";
    }
}
