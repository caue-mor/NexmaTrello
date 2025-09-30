"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "INVITE" | "ALERT";
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  relatedCardId: string | null;
  relatedBoardId: string | null;
}

export function NotificationCard({ notification }: { notification: Notification }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function markAsRead() {
    if (notification.readAt) return; // Já está lida

    try {
      const res = await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PUT",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh(); // Atualiza a página para refletir mudança
        window.location.reload(); // Force reload para atualizar contador
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  }

  async function handleInviteAction(action: "accept" | "decline") {
    if (!notification.relatedBoardId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/invites/${action}-from-notification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: notification.relatedBoardId }),
      });

      if (res.ok) {
        await markAsRead();
        router.refresh();
      }
    } catch (err) {
      console.error(`${action} invite error:`, err);
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick() {
    if (notification.relatedCardId && notification.relatedBoardId) {
      router.push(`/board/${notification.relatedBoardId}?card=${notification.relatedCardId}`);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 transition cursor-pointer ${
        notification.readAt
          ? "bg-white border-neutral-200"
          : "bg-blue-50 border-blue-200 hover:bg-blue-100"
      }`}
      onClick={notification.relatedCardId ? handleCardClick : markAsRead}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-neutral-500 uppercase">
              {notification.type}
            </span>
            {!notification.readAt && (
              <span className="h-2 w-2 bg-blue-600 rounded-full" />
            )}
          </div>
          <p className="font-medium mb-1">{notification.title}</p>
          <p className="text-sm text-neutral-600">{notification.message}</p>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {notification.type === "INVITE" && !notification.readAt && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleInviteAction("accept")}
                disabled={loading}
              >
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleInviteAction("decline")}
                disabled={loading}
              >
                Recusar
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="text-xs text-neutral-500 mt-2">
        {new Date(notification.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}