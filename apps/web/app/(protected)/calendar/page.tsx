import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CalendarView } from "@/components/calendar/CalendarView";

async function getGoogleConnectionStatus(userId: string) {
    const token = await prisma.googleToken.findUnique({
        where: { userId },
        select: { id: true },
    });
    return !!token;
}

export default async function CalendarPage() {
    const user = await requireAuth();
    const isConnected = await getGoogleConnectionStatus(user.id);

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Calendário</h1>
                    <p className="text-neutral-600 mt-1">
                        Gerencie seus prazos e eventos
                    </p>
                </div>

                <CalendarView isConnected={isConnected} />
            </div>
        </div>
    );
}
