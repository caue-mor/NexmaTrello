import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    const user = await requireAuth();

    // Marcar todas as notificações não lidas como lidas
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      count: result.count,
    });
  } catch (err) {
    console.error("Mark all as read error:", err);
    return NextResponse.json(
      { error: "Erro ao marcar notificações como lidas" },
      { status: 500 }
    );
  }
}
