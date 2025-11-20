import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    try {
        const { user } = await getSession();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { boardId } = params;

        // Verificar se o usuário tem acesso ao board
        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                OR: [
                    { isOrgWide: true },
                    { ownerId: user.id },
                    { members: { some: { userId: user.id } } },
                ],
            },
            select: { id: true },
        });

        if (!board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        // Buscar todos os membros do board com suas estatísticas
        const members = await prisma.boardMember.findMany({
            where: { boardId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        stats: {
                            select: {
                                level: true,
                                xp: true,
                                tasksCompleted: true,
                                cardsCompleted: true,
                            },
                        },
                    },
                },
            },
        });

        // Mapear e ordenar por XP
        const ranking = members
            .map((member) => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                level: member.user.stats?.level || 1,
                xp: member.user.stats?.xp || 0,
                tasksCompleted: member.user.stats?.tasksCompleted || 0,
                cardsCompleted: member.user.stats?.cardsCompleted || 0,
            }))
            .sort((a, b) => {
                // Ordenar por nível primeiro, depois por XP
                if (b.level !== a.level) {
                    return b.level - a.level;
                }
                return b.xp - a.xp;
            });

        return NextResponse.json({ ranking });
    } catch (error) {
        console.error("Get board ranking error:", error);
        return NextResponse.json(
            { error: "Erro ao buscar ranking" },
            { status: 500 }
        );
    }
}
