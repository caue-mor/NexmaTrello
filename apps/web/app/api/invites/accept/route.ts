import { NextResponse } from "next/server";
import { inviteAcceptSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token } = inviteAcceptSchema.parse(body);

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { token },
    });

    if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Convite inválido ou expirado" },
        { status: 400 }
      );
    }

    // Verify email matches
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser || currentUser.email !== invite.email) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Accept invite and add user to board
    await prisma.$transaction([
      prisma.boardMember.upsert({
        where: {
          boardId_userId: {
            boardId: invite.boardId,
            userId: user.id,
          },
        },
        update: {},
        create: {
          boardId: invite.boardId,
          userId: user.id,
          role: "MEMBER",
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedById: user.id,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Accept invite error:", err);
    return NextResponse.json(
      { error: "Erro ao aceitar convite" },
      { status: 500 }
    );
  }
}