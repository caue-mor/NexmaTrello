import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const declineInviteSchema = z.object({
  inviteId: z.string(),
});

export async function POST(req: Request) {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { inviteId } = declineInviteSchema.parse(body);

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Convite não encontrado ou já foi processado" },
        { status: 404 }
      );
    }

    // Verify email matches current user
    if (invite.email !== user.email) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Update invite status to DECLINED
    await prisma.invite.update({
      where: { id: inviteId },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Decline invite error:", err);
    return NextResponse.json(
      { error: "Erro ao recusar convite" },
      { status: 500 }
    );
  }
}
