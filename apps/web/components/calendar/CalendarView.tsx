"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert-1";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { TicketModal } from "@/components/tickets/TicketModal";

const locales = {
    "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    isConnected: boolean;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    type: "ticket" | "google";
    priority?: string;
    status?: string;
    color?: string;
}

export function CalendarView({ isConnected }: CalendarViewProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"success" | "error" | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.MONTH);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get("success") === "true") {
            setStatus("success");
            router.replace("/calendar");
        } else if (searchParams.get("error")) {
            setStatus("error");
        }
    }, [searchParams, router]);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            // Calcular start e end baseado na view atual (simplificado: pega mês atual +/- 1 mês)
            const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);

            const params = new URLSearchParams({
                start: start.toISOString(),
                end: end.toISOString(),
            });

            const res = await fetch(`/api/calendar/events?${params}`);
            if (!res.ok) throw new Error("Failed to fetch events");

            const data = await res.json();

            // Converter strings de data para objetos Date
            const formattedEvents = data.events.map((evt: any) => ({
                ...evt,
                start: new Date(evt.start),
                end: new Date(evt.end),
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleConnect = () => {
        window.location.href = "/api/auth/google";
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if (event.type === "ticket") {
            setSelectedTicketId(event.id);
        }
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const style = {
            backgroundColor: event.color || "#3b82f6",
            borderRadius: "4px",
            opacity: 0.8,
            color: "white",
            border: "0px",
            display: "block",
        };
        return { style };
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-neutral-200 shadow-sm text-center min-h-[400px]">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Conectar Google Calendar
                </h2>
                <p className="text-neutral-600 max-w-md mb-8">
                    Sincronize seus tickets e prazos automaticamente com sua agenda do Google.
                    Nunca mais perca uma data de entrega.
                </p>

                {status === "error" && (
                    <Alert variant="destructive" className="mb-6 max-w-md text-left">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Erro na conexão</AlertTitle>
                        <AlertDescription>
                            Não foi possível conectar sua conta. Tente novamente.
                        </AlertDescription>
                    </Alert>
                )}

                <Button onClick={handleConnect} size="lg" className="gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Conectar com Google
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {status === "success" && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Conectado com sucesso!</AlertTitle>
                    <AlertDescription>
                        Seu Google Calendar está sincronizado.
                    </AlertDescription>
                </Alert>
            )}

            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Google Calendar</h2>
                            <p className="text-sm text-neutral-500">Sincronização ativa</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            Configurações
                        </Button>
                    </div>
                </div>

                <div className="h-[700px]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: "100%" }}
                        culture="pt-BR"
                        messages={{
                            next: "Próximo",
                            previous: "Anterior",
                            today: "Hoje",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                            agenda: "Agenda",
                            date: "Data",
                            time: "Hora",
                            event: "Evento",
                            noEventsInRange: "Sem eventos neste período",
                        }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        date={date}
                        onNavigate={setDate}
                        view={view}
                        onView={setView}
                        popup
                    />
                </div>
            </div>

            {selectedTicketId && (
                <TicketModal
                    ticketId={selectedTicketId}
                    open={!!selectedTicketId}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedTicketId(null);
                            fetchEvents();
                        }
                    }}
                />
            )}
        </div>
    );
}
