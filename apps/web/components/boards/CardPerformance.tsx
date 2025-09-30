import { computeCardPerformance } from "@/lib/utils";

interface CardPerformanceProps {
  card: {
    dueAt?: Date | string | null;
    checklists: { items: { done: boolean }[] }[];
  };
  variant?: "compact" | "detailed";
}

export function CardPerformance({ card, variant = "compact" }: CardPerformanceProps) {
  const dueAt = card.dueAt ? (typeof card.dueAt === "string" ? new Date(card.dueAt) : card.dueAt) : null;

  const performance = computeCardPerformance({
    dueAt,
    checklists: card.checklists,
  });

  const getPerformanceColor = () => {
    if (performance.overdue) return "text-red-600 bg-red-50";
    if (performance.pct === 100) return "text-green-600 bg-green-50";
    if (performance.pct >= 70) return "text-blue-600 bg-blue-50";
    if (performance.pct >= 40) return "text-orange-600 bg-orange-50";
    return "text-neutral-600 bg-neutral-50";
  };

  const getPerformanceLabel = () => {
    if (performance.overdue) return "Atrasado";
    if (performance.pct === 100) return "Concluído";
    if (performance.pct >= 70) return "No prazo";
    if (performance.pct >= 40) return "Em andamento";
    return "Iniciando";
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                performance.overdue
                  ? "bg-red-500"
                  : performance.pct === 100
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${performance.pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-neutral-600 font-medium min-w-[3ch] text-right">
          {performance.pct}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900">Performance</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPerformanceColor()}`}>
          {getPerformanceLabel()}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>
            {performance.done} de {performance.total} tarefas
          </span>
          <span className="font-medium">{performance.pct}%</span>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              performance.overdue
                ? "bg-red-500"
                : performance.pct === 100
                ? "bg-green-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${performance.pct}%` }}
          />
        </div>
      </div>

      {dueAt && (
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className={performance.overdue ? "text-red-600 font-medium" : ""}>
            Vence: {dueAt.toLocaleDateString("pt-BR")}
            {performance.overdue && " (Atrasado)"}
          </span>
        </div>
      )}
    </div>
  );
}