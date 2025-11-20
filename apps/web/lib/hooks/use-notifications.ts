import { useState, useEffect, useCallback } from "react";

export interface Notification {
    id: string;
    type: "INVITE" | "ALERT" | "MENTION" | "ASSIGNMENT" | "COMMENT" | "DUE_DATE" | "BOARD_UPDATE";
    title: string;
    message: string;
    readAt: string | null;
    createdAt: string;
    card?: {
        id: string;
        title: string;
        column: {
            boardId: string;
            board: {
                title: string;
            };
        };
    };
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications?limit=50");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: Notification) => !n.readAt).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (ids: string[]) => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - ids.length));

            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: ids }),
            });
        } catch (error) {
            console.error("Error marking notifications as read:", error);
            // Revert on error (could be improved)
            fetchNotifications();
        }
    }, [fetchNotifications]);

    const markAllAsRead = useCallback(async () => {
        try {
            // Optimistic update
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
            setUnreadCount(0);

            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            fetchNotifications();
        }
    }, [fetchNotifications]);

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}
