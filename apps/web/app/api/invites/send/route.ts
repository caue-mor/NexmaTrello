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
    console.log("Invite send request body:", body);
    const { boardId, email, role } = inviteSendSchema.parse(body);
    console.log("Validated invite data:", { boardId, email, role });

    // Check if user has permission (any member can invite in org-wide boards, otherwise OWNER/ADMIN)
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { isOrgWide: true, ownerId: true },
    });

    console.log("Board found:", board);

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    // For org-wide boards, any authenticated user can invite
    // For private boards, only ADMIN can invite (OWNER is treated as ADMIN)
    if (!board.isOrgWide) {
      console.log("Checking board role for user:", user.id);
      const memberRole = await assertBoardRole(boardId, user.id, ["ADMIN"]);
      console.log("Member role result:", memberRole);
      if (!memberRole || memberRole.role !== "ADMIN") {
        return NextResponse.json({ error: "Apenas administradores podem convidar" }, { status: 403 });
      }
    }

    // Check if user is already a member
    const existingMember = await prisma.boardMember.findFirst({
      where: {
        boardId,
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Usuário já é membro deste grupo" },
        { status: 409 }
      );
    }

    // Check if invite already exists (only PENDING status)
    console.log("Checking for existing invite...");
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

    console.log("Existing invite:", existingInvite);

    if (existingInvite) {
      return NextResponse.json(
        { error: "Convite já enviado para este e-mail" },
        { status: 409 }
      );
    }

    // Create invite
    console.log("Creating new invite with role:", role);
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

    console.log("Invite created successfully:", invite.id);

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