import { NextResponse } from "next/server";
import { inviteAcceptSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Support both token (for email links) and inviteId (for authenticated toast)
const flexibleAcceptSchema = z.union([
  inviteAcceptSchema,
  z.object({ inviteId: z.string() }),
]);

export async function POST(req: Request) {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = flexibleAcceptSchema.parse(body);

    // Find invite by token or inviteId
    const invite = "token" in parsed
      ? await prisma.invite.findUnique({ where: { token: parsed.token } })
      : await prisma.invite.findUnique({ where: { id: parsed.inviteId } });

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
          id: crypto.randomUUID(),
          boardId: invite.boardId,
          userId: user.id,
          role: invite.role, // Usar role do convite em vez de hardcoded MEMBER
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