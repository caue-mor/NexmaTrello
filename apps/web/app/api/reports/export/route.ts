import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const formatType = searchParams.get("format"); // csv, xlsx
        const range = searchParams.get("range") || "30";
        const boardId = searchParams.get("boardId");

        if (!formatType || !["csv", "xlsx"].includes(formatType)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        const startDate = subDays(new Date(), parseInt(range));

        const whereClause: any = {
            board: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            createdAt: {
                gte: startDate,
            },
        };

        if (boardId) {
            whereClause.boardId = boardId;
        }

        // Fetch detailed data
        const cards = await prisma.card.findMany({
            where: whereClause,
            include: {
                board: {
                    select: { title: true },
                },
                column: {
                    select: { title: true },
                },
                createdBy: {
                    select: { name: true, email: true },
                },
                assignees: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Transform data for export
        const data = cards.map((card) => ({
            ID: card.id,
            Título: card.title,
            Board: card.board.title,
            Coluna: card.column.title,
            Prioridade: card.urgency,
            "Criado em": format(card.createdAt, "dd/MM/yyyy HH:mm"),
            "Concluído em": card.completedAt ? format(card.completedAt, "dd/MM/yyyy HH:mm") : "-",
            "Criado por": card.createdBy.name || card.createdBy.email,
            "Atribuído a": card.assignees.map((a) => a.user.name || a.user.email).join(", "),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

        if (formatType === "csv") {
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="relatorio-${range}dias.csv"`,
                },
            });
        } else {
            const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="relatorio-${range}dias.xlsx"`,
                },
            });
        }
    } catch (error) {
        console.error("Error exporting report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
