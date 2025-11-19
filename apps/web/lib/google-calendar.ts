import { getGoogleCalendarClient } from "./google";
import { Ticket, User } from "@prisma/client";
import { prisma } from "./db";

export async function createCalendarEvent(ticket: Ticket, userId: string) {
    if (!ticket.dueDate) return null;

    try {
        const calendar = await getGoogleCalendarClient(userId);

        const event = {
            summary: `[Ticket #${ticket.ticketNumber}] ${ticket.title}`,
            description: ticket.description || "",
            start: {
                dateTime: ticket.dueDate.toISOString(),
            },
            end: {
                dateTime: new Date(ticket.dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hora de duração por padrão
            },
            colorId: getPriorityColor(ticket.priority),
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });

        if (response.data.id) {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: { googleEventId: response.data.id },
            });
        }

        return response.data;
    } catch (error) {
        console.error("Error creating Google Calendar event:", error);
        // Não falhar o fluxo principal se o calendário falhar
        return null;
    }
}

export async function updateCalendarEvent(ticket: Ticket, userId: string) {
    if (!ticket.googleEventId || !ticket.dueDate) return null;

    try {
        const calendar = await getGoogleCalendarClient(userId);

        const event = {
            summary: `[Ticket #${ticket.ticketNumber}] ${ticket.title}`,
            description: ticket.description || "",
            start: {
                dateTime: ticket.dueDate.toISOString(),
            },
            end: {
                dateTime: new Date(ticket.dueDate.getTime() + 60 * 60 * 1000).toISOString(),
            },
            colorId: getPriorityColor(ticket.priority),
        };

        await calendar.events.update({
            calendarId: "primary",
            eventId: ticket.googleEventId,
            requestBody: event,
        });
    } catch (error) {
        console.error("Error updating Google Calendar event:", error);
    }
}

export async function deleteCalendarEvent(ticket: Ticket, userId: string) {
    if (!ticket.googleEventId) return null;

    try {
        const calendar = await getGoogleCalendarClient(userId);

        await calendar.events.delete({
            calendarId: "primary",
            eventId: ticket.googleEventId,
        });

        await prisma.ticket.update({
            where: { id: ticket.id },
            data: { googleEventId: null },
        });
    } catch (error) {
        console.error("Error deleting Google Calendar event:", error);
    }
}

function getPriorityColor(priority: string) {
    // Mapeamento de cores do Google Calendar
    // 11: Tomato (High/Critical)
    // 5: Yellow (Medium)
    // 2: Sage (Low)
    switch (priority) {
        case "CRITICAL":
        case "URGENT":
            return "11";
        case "HIGH":
            return "4"; // Flamingo
        case "MEDIUM":
            return "5";
        case "LOW":
            return "2";
        default:
            return "1"; // Lavender
    }
}
