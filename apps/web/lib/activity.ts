/**
 * Activity Logger - Sistema de Audit Trail
 *
 * Este módulo fornece funções para registrar todas as atividades
 * dos usuários no sistema, criando um histórico completo e auditável.
 */

import { prisma } from "@/lib/db";
import { ActivityType } from "@prisma/client";

interface ActivityMetadata {
  [key: string]: any;
}

interface CreateActivityParams {
  boardId: string;
  userId: string;
  type: ActivityType;
  cardId?: string;
  clientId?: string;
  metadata?: ActivityMetadata;
}

/**
 * Registra uma atividade no sistema
 *
 * TODO: Esta função está temporariamente desabilitada porque o modelo Activity
 * ainda não existe no banco de dados. Será habilitada quando o modelo for criado.
 */
export async function logActivity(params: CreateActivityParams) {
  try {
    // TODO: Habilitar quando modelo Activity for criado no banco de dados
    // await prisma.activity.create({
    //   data: {
    //     boardId: params.boardId,
    //     userId: params.userId,
    //     type: params.type,
    //     cardId: params.cardId,
    //     clientId: params.clientId,
    //     metadata: params.metadata || {},
    //   },
    // });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Não falhar a operação principal se o log falhar
  }
}

/**
 * Helpers específicos para cada tipo de atividade
 */

export async function logCardCreated(
  boardId: string,
  cardId: string,
  userId: string,
  cardTitle: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CARD_CREATED",
    metadata: { title: cardTitle },
  });
}

export async function logCardUpdated(
  boardId: string,
  cardId: string,
  userId: string,
  changes: { field: string; oldValue: any; newValue: any }[]
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CARD_UPDATED",
    metadata: { changes },
  });
}

export async function logCardMoved(
  boardId: string,
  cardId: string,
  userId: string,
  fromColumn: string,
  toColumn: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CARD_MOVED",
    metadata: { fromColumn, toColumn },
  });
}

export async function logCardDeleted(
  boardId: string,
  cardId: string,
  userId: string,
  cardTitle: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CARD_DELETED",
    metadata: { title: cardTitle },
  });
}

export async function logCardAssigned(
  boardId: string,
  cardId: string,
  userId: string,
  assignedUserId: string,
  assignedUserName: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CARD_ASSIGNED",
    metadata: { assignedUserId, assignedUserName },
  });
}

export async function logCardUnassigned(
  boardId: string,
  cardId: string,
  userId: string,
  unassignedUserId: string,
  unassignedUserName: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CARD_UNASSIGNED",
    metadata: { unassignedUserId, unassignedUserName },
  });
}

export async function logChecklistCreated(
  boardId: string,
  cardId: string,
  userId: string,
  checklistTitle: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CHECKLIST_CREATED",
    metadata: { title: checklistTitle },
  });
}

export async function logChecklistItemCompleted(
  boardId: string,
  cardId: string,
  userId: string,
  itemContent: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CHECKLIST_ITEM_COMPLETED",
    metadata: { itemContent },
  });
}

export async function logChecklistItemUncompleted(
  boardId: string,
  cardId: string,
  userId: string,
  itemContent: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "CHECKLIST_ITEM_UNCOMPLETED",
    metadata: { itemContent },
  });
}

export async function logCommentAdded(
  boardId: string,
  cardId: string,
  userId: string,
  commentPreview: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "COMMENT_ADDED",
    metadata: { preview: commentPreview.substring(0, 100) },
  });
}

export async function logAttachmentAdded(
  boardId: string,
  cardId: string,
  userId: string,
  fileName: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "ATTACHMENT_ADDED",
    metadata: { fileName },
  });
}

export async function logAttachmentDeleted(
  boardId: string,
  cardId: string,
  userId: string,
  fileName: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "ATTACHMENT_DELETED",
    metadata: { fileName },
  });
}

export async function logLabelAdded(
  boardId: string,
  cardId: string,
  userId: string,
  labelName: string,
  labelColor: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "LABEL_ADDED",
    metadata: { labelName, labelColor },
  });
}

export async function logLabelRemoved(
  boardId: string,
  cardId: string,
  userId: string,
  labelName: string
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "LABEL_REMOVED",
    metadata: { labelName },
  });
}

export async function logClientStatusChanged(
  boardId: string,
  clientId: string,
  userId: string,
  oldStatus: string,
  newStatus: string
) {
  await logActivity({
    boardId,
    clientId,
    userId,
    type: "CLIENT_STATUS_CHANGED",
    metadata: { oldStatus, newStatus },
  });
}

export async function logDueDateChanged(
  boardId: string,
  cardId: string,
  userId: string,
  oldDate: string | null,
  newDate: string | null
) {
  await logActivity({
    boardId,
    cardId,
    userId,
    type: "DUE_DATE_CHANGED",
    metadata: { oldDate, newDate },
  });
}

/**
 * Buscar atividades com filtros
 *
 * TODO: Esta função está temporariamente desabilitada porque o modelo Activity
 * ainda não existe no banco de dados. Retorna array vazio até o modelo ser criado.
 */
export async function getActivities(params: {
  boardId?: string;
  cardId?: string;
  clientId?: string;
  userId?: string;
  type?: ActivityType;
  limit?: number;
  offset?: number;
}) {
  const { boardId, cardId, clientId, userId, type, limit = 50, offset = 0 } = params;

  // TODO: Habilitar quando modelo Activity for criado no banco de dados
  // return await prisma.activity.findMany({
  //   where: {
  //     ...(boardId && { boardId }),
  //     ...(cardId && { cardId }),
  //     ...(clientId && { clientId }),
  //     ...(userId && { userId }),
  //     ...(type && { type }),
  //   },
  //   include: {
  //     user: {
  //       select: {
  //         id: true,
  //         name: true,
  //         email: true,
  //       },
  //     },
  //     card: {
  //       select: {
  //         id: true,
  //         title: true,
  //       },
  //     },
  //     client: {
  //       select: {
  //         id: true,
  //         name: true,
  //       },
  //     },
  //   },
  //   orderBy: {
  //     createdAt: "desc",
  //   },
  //   take: limit,
  //   skip: offset,
  // });

  return [];
}

/**
 * Formatar atividade para display
 */
export function formatActivityMessage(activity: {
  type: ActivityType;
  user: { name: string | null; email: string };
  metadata?: any;
}): string {
  const userName = activity.user.name || activity.user.email.split("@")[0];

  switch (activity.type) {
    case "CARD_CREATED":
      return `${userName} criou o card "${activity.metadata?.title}"`;
    case "CARD_UPDATED":
      return `${userName} atualizou o card`;
    case "CARD_MOVED":
      return `${userName} moveu o card de "${activity.metadata?.fromColumn}" para "${activity.metadata?.toColumn}"`;
    case "CARD_DELETED":
      return `${userName} deletou o card "${activity.metadata?.title}"`;
    case "CARD_ASSIGNED":
      return `${userName} atribuiu ${activity.metadata?.assignedUserName} ao card`;
    case "CARD_UNASSIGNED":
      return `${userName} removeu ${activity.metadata?.unassignedUserName} do card`;
    case "CHECKLIST_CREATED":
      return `${userName} criou a checklist "${activity.metadata?.title}"`;
    case "CHECKLIST_ITEM_COMPLETED":
      return `${userName} completou um item da checklist`;
    case "CHECKLIST_ITEM_UNCOMPLETED":
      return `${userName} desmarcou um item da checklist`;
    case "COMMENT_ADDED":
      return `${userName} adicionou um comentário`;
    case "ATTACHMENT_ADDED":
      return `${userName} anexou "${activity.metadata?.fileName}"`;
    case "ATTACHMENT_DELETED":
      return `${userName} removeu o anexo "${activity.metadata?.fileName}"`;
    case "LABEL_ADDED":
      return `${userName} adicionou a tag "${activity.metadata?.labelName}"`;
    case "LABEL_REMOVED":
      return `${userName} removeu a tag "${activity.metadata?.labelName}"`;
    case "CLIENT_STATUS_CHANGED":
      return `${userName} mudou o status do cliente de ${activity.metadata?.oldStatus} para ${activity.metadata?.newStatus}`;
    case "DUE_DATE_CHANGED":
      return `${userName} alterou a data de vencimento`;
    default:
      return `${userName} realizou uma ação`;
  }
}
