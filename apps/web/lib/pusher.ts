import Pusher from "pusher";

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher | null {
  // Only initialize if environment variables are set
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.PUSHER_KEY ||
    !process.env.PUSHER_SECRET ||
    !process.env.PUSHER_CLUSTER
  ) {
    console.warn("Pusher credentials not configured. Real-time features disabled.");
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherInstance;
}

// Helper functions for common real-time events

export async function triggerBoardUpdate(boardId: string, event: string, data: any) {
  const pusher = getPusher();
  if (!pusher) return;

  try {
    await pusher.trigger(`board-${boardId}`, event, data);
  } catch (err) {
    console.error("Pusher trigger error:", err);
  }
}

export async function triggerUserNotification(userId: string, data: any) {
  const pusher = getPusher();
  if (!pusher) return;

  try {
    await pusher.trigger(`user-${userId}`, "notification:new", data);
  } catch (err) {
    console.error("Pusher trigger error:", err);
  }
}

export async function notifyCardCreated(boardId: string, card: any) {
  await triggerBoardUpdate(boardId, "card:created", { card });
}

export async function notifyCardUpdated(boardId: string, card: any) {
  await triggerBoardUpdate(boardId, "card:updated", { card });
}

export async function notifyCardMoved(boardId: string, cardId: string, fromColumn: string, toColumn: string) {
  await triggerBoardUpdate(boardId, "card:moved", {
    cardId,
    fromColumn,
    toColumn,
  });
}

export async function notifyCardDeleted(boardId: string, cardId: string) {
  await triggerBoardUpdate(boardId, "card:deleted", { cardId });
}

export async function notifyColumnCreated(boardId: string, column: any) {
  await triggerBoardUpdate(boardId, "column:created", { column });
}