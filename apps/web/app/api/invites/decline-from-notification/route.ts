import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const declineInviteSchema = z.object({
  boardId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = declineInviteSchema.parse(body);

    // Find pending invite for this user and board
    const invite = await prisma.invite.findFirst({
      where: {
        boardId: data.boardId,
        email: user.email,
        status: "PENDING",
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado ou já foi processado" },
        { status: 404 }
      );
    }

    // Update invite status to DECLINED and mark notification as read
    await prisma.$transaction([
      prisma.invite.update({
        where: { id: invite.id },
        data: { status: "DECLINED" },
      }),
      // Mark notification as read
      prisma.notification.updateMany({
        where: {
          userId: user.id,
          relatedBoardId: data.boardId,
          type: "INVITE",
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Decline invite error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao recusar convite" },
      { status: 500 }
    );
  }
}