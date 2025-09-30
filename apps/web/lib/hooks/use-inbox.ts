import { useState, useEffect } from "react";

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

export function useInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar notificações");
      }

      const data = await res.json();
      const notifs = data.list || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.readAt).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao marcar como lida");
      }

      await fetchNotifications(); // Refresh
    } catch (err) {
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.readAt);
      await Promise.all(unread.map((n) => markAsRead(n.id)));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}