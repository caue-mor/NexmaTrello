import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const acceptInviteSchema = z.object({
  boardId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = acceptInviteSchema.parse(body);

    // Find pending invite for this user and board
    const invite = await prisma.invite.findFirst({
      where: {
        boardId: data.boardId,
        email: user.email,
        status: "PENDING",
      },
      include: {
        board: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado ou já foi aceito" },
        { status: 404 }
      );
    }

    // Check if invite has expired
    if (new Date() > invite.expiresAt) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Convite expirado" },
        { status: 400 }
      );
    }

    // Accept invite in a transaction
    await prisma.$transaction([
      // Create board membership with role from invite
      prisma.boardMember.create({
        data: {
          boardId: data.boardId,
          userId: user.id,
          role: invite.role,
        },
      }),
      // Update invite status
      prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedById: user.id,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      board: invite.board,
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao aceitar convite" },
      { status: 500 }
    );
  }
}