import { NextResponse } from "next/server";
import { inviteSendSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertBoardRole } from "@/lib/rbac";
import crypto from "node:crypto";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { boardId, email, role } = inviteSendSchema.parse(body);

    // Check if user has permission (any member can invite in org-wide boards, otherwise OWNER/ADMIN)
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { isOrgWide: true, ownerId: true },
    });

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    // For org-wide boards, any authenticated user can invite
    // For private boards, only ADMIN can invite (OWNER is treated as ADMIN)
    if (!board.isOrgWide) {
      const memberRole = await assertBoardRole(boardId, user.id, ["ADMIN"]);
      if (!memberRole || memberRole.role !== "ADMIN") {
        return NextResponse.json({ error: "Apenas administradores podem convidar" }, { status: 403 });
      }
    }

    // Check if invite already exists
    const existingInvite = await prisma.invite.findFirst({
      where: {
        boardId,
        email,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Convite já enviado para este e-mail" },
        { status: 409 }
      );
    }

    // Create invite
    const token = crypto.randomBytes(24).toString("hex");
    const invite = await prisma.invite.create({
      data: {
        boardId,
        email,
        role,
        token,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });

    // Create notification for target user if they exist
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (targetUser) {
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: "INVITE",
          title: `Convite para ${board?.title || "grupo"}`,
          message: `${user.name || user.email} convidou você para participar`,
          relatedBoardId: boardId,
        },
      });
    }

    return NextResponse.json({ ok: true, invite });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Send invite error:", err);
    return NextResponse.json(
      { error: "Erro ao enviar convite" },
      { status: 500 }
    );
  }
}