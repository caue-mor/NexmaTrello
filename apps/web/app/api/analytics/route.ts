import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "30"; // days
        const boardId = searchParams.get("boardId");

        const startDate = subDays(new Date(), parseInt(range));

        // Base filter for user's boards
        const whereClause: any = {
            board: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
        };

        if (boardId) {
            whereClause.boardId = boardId;
        }

        // 1. Cards Completed Over Time (Line Chart)
        const completedCards = await prisma.card.findMany({
            where: {
                ...whereClause,
                completedAt: {
                    gte: startDate,
                },
            },
            select: {
                completedAt: true,
            },
        });

        // Group by date
        const cardsByDate = completedCards.reduce((acc, card) => {
            if (!card.completedAt) return acc;
            const date = format(card.completedAt, "yyyy-MM-dd");
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Fill missing dates
        const days = eachDayOfInterval({ start: startDate, end: new Date() });
        const completedOverTime = days.map((day) => {
            const date = format(day, "yyyy-MM-dd");
            return {
                date: format(day, "dd/MM", { locale: ptBR }),
                count: cardsByDate[date] || 0,
            };
        });

        // 2. Cards by Column (Bar Chart) - Snapshot of current state
        const cardsByColumn = await prisma.card.groupBy({
            by: ["columnId"],
            where: whereClause,
            _count: {
                id: true,
            },
        });

        // Need to fetch column names
        const columns = await prisma.column.findMany({
            where: {
                id: {
                    in: cardsByColumn.map((c) => c.columnId),
                },
            },
            select: {
                id: true,
                title: true,
            },
        });

        const columnDistribution = cardsByColumn.map((item) => {
            const column = columns.find((c) => c.id === item.columnId);
            return {
                name: column?.title || "Desconhecida",
                value: item._count.id,
            };
        });

        // 3. Cards by Priority (Pie Chart)
        const cardsByPriority = await prisma.card.groupBy({
            by: ["urgency"],
            where: whereClause,
            _count: {
                id: true,
            },
        });

        const priorityDistribution = cardsByPriority.map((item) => ({
            name: item.urgency,
            value: item._count.id,
        }));

        // 4. Key Metrics
        const totalCards = await prisma.card.count({ where: whereClause });
        const completedTotal = await prisma.card.count({
            where: {
                ...whereClause,
                completedAt: { not: null },
            },
        });

        // Calculate completion rate
        const completionRate = totalCards > 0 ? Math.round((completedTotal / totalCards) * 100) : 0;

        return NextResponse.json({
            completedOverTime,
            columnDistribution,
            priorityDistribution,
            metrics: {
                totalCards,
                completedTotal,
                completionRate,
            },
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
