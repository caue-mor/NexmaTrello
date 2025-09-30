import { prisma } from "./db";
import { Role } from "@prisma/client";

export async function assertBoardRole(
  boardId: string,
  userId: string,
  allowedRoles: Role[] = ["MEMBER", "ADMIN", "OWNER"]
) {
  // First check if user is board owner or if board is org-wide
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true, isOrgWide: true },
  });

  if (!board) {
    throw new Error("Board não encontrado");
  }

  // Owner always has access - check if OWNER is in allowedRoles
  const isOwner = board.ownerId === userId;

  if (isOwner) {
    if (!allowedRoles.includes("OWNER")) {
      throw new Error("Acesso negado");
    }
    return { role: "OWNER" as Role, boardId, userId };
  }

  // Org-wide boards allow MEMBER access to all users
  if (board.isOrgWide) {
    if (!allowedRoles.includes("MEMBER")) {
      throw new Error("Acesso negado");
    }
    return { role: "MEMBER" as Role, boardId, userId };
  }

  // Check BoardMember record for explicit membership
  const member = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Acesso negado");
  }

  return member;
}

export async function getBoardRole(boardId: string, userId: string) {
  const member = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
  });

  return member?.role ?? null;
}

export async function isOwnerOrAdmin(boardId: string, userId: string): Promise<boolean> {
  const role = await getBoardRole(boardId, userId);
  return role === "OWNER" || role === "ADMIN";
}