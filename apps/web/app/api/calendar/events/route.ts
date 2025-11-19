import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGoogleCalendarClient } from "@/lib/google";

export async function GET(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startStr = searchParams.get("start");
        const endStr = searchParams.get("end");

        if (!startStr || !endStr) {
            return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
        }

        const start = new Date(startStr);
        const end = new Date(endStr);

        // 1. Buscar tickets locais com prazo no intervalo
        const tickets = await prisma.ticket.findMany({
            where: {
                OR: [
                    { requesterId: user.id },
                    { assignedToId: user.id },
                    { board: { ownerId: user.id } },
                ],
                dueDate: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                priority: true,
                status: true,
                ticketNumber: true,
                googleEventId: true,
            },
        });

        const localEvents = tickets.map(ticket => ({
            id: ticket.id,
            title: `#${ticket.ticketNumber} ${ticket.title}`,
            start: ticket.dueDate,
            end: ticket.dueDate, // Tickets são pontos no tempo por enquanto, ou duram 1h
            allDay: true, // Assumindo dia todo para simplificar visualização
            type: "ticket",
            priority: ticket.priority,
            status: ticket.status,
            color: getPriorityColor(ticket.priority),
        }));

        // 2. Buscar eventos do Google Calendar se conectado
        let googleEvents: any[] = [];
        try {
            const calendar = await getGoogleCalendarClient(user.id);
            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                singleEvents: true,
                orderBy: "startTime",
            });

            if (response.data.items) {
                googleEvents = response.data.items
                    .filter(item => {
                        // Filtrar eventos que já são tickets nossos (evitar duplicação visual)
                        // Se o ticket tem googleEventId, ele vai aparecer como localEvent.
                        // Mas o evento do Google também virá.
                        // Podemos filtrar pelo ID se soubermos, ou apenas mostrar ambos (um como "Google" outro como "Ticket")
                        // Para melhor UX, vamos tentar não mostrar duplicado se tivermos certeza.
                        const isOurTicket = tickets.some(t => t.googleEventId === item.id);
                        return !isOurTicket;
                    })
                    .map(item => ({
                        id: item.id,
                        title: item.summary || "(Sem título)",
                        start: item.start?.dateTime || item.start?.date,
                        end: item.end?.dateTime || item.end?.date,
                        allDay: !item.start?.dateTime, // Se não tem hora, é dia todo
                        type: "google",
                        color: "#4285F4", // Azul Google
                    }));
            }
        } catch (err) {
            // Ignorar erro de conexão com Google (pode não estar conectado ou token expirado)
            console.log("Google Calendar fetch skipped or failed:", err);
        }

        return NextResponse.json({ events: [...localEvents, ...googleEvents] });
    } catch (err) {
        console.error("Get calendar events error:", err);
        return NextResponse.json({ error: "Erro ao buscar eventos" }, { status: 500 });
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case "CRITICAL": return "#ef4444"; // red-500
        case "URGENT": return "#f97316"; // orange-500
        case "HIGH": return "#eab308"; // yellow-500
        case "MEDIUM": return "#3b82f6"; // blue-500
        case "LOW": return "#22c55e"; // green-500
        default: return "#64748b"; // slate-500
    }
}
