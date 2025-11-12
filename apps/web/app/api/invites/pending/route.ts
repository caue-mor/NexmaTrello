import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Buscar convites PENDING do usuário
    const invites = await prisma.invite.findMany({
      where: {
        email: user.email,
        status: "PENDING",
      },
      include: {
        board: {
          select: {
            title: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Máximo 5 convites por vez
    });

    return NextResponse.json(invites);
  } catch (err) {
    console.error("Get pending invites error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar convites" },
      { status: 500 }
    );
  }
}
