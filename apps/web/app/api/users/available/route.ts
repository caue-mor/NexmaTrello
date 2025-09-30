import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get("boardId");
    const onlyMembers = searchParams.get("onlyMembers") === "true";

    if (!boardId) {
      return NextResponse.json({ error: "boardId required" }, { status: 400 });
    }

    if (onlyMembers) {
      // Para atribuição de cards: apenas membros do board
      const boardMembers = await prisma.boardMember.findMany({
        where: { boardId },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const users = boardMembers.map((bm) => bm.user);
      return NextResponse.json({ users });
    }

    // Para convites: todos os usuários ativos
    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    // Buscar membros atuais do board para marcar quem já é membro
    const existingMembers = await prisma.boardMember.findMany({
      where: { boardId },
      select: { userId: true },
    });

    const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

    // Adicionar flag indicando se já é membro
    const usersWithMembershipStatus = allUsers.map((u) => ({
      ...u,
      isMember: existingMemberIds.has(u.id),
    }));

    return NextResponse.json({ users: usersWithMembershipStatus });
  } catch (err) {
    console.error("Get available users error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}