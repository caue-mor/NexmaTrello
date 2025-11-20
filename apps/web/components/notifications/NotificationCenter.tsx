"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Settings, MessageSquare, User, Calendar, AlertCircle, Layout } from "lucide-react";
import { useNotifications, Notification } from "@/lib/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { NotificationSettings } from "./NotificationSettings";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "MENTION": return <User className="w-4 h-4 text-blue-500" />;
            case "ASSIGNMENT": return <User className="w-4 h-4 text-green-500" />;
            case "COMMENT": return <MessageSquare className="w-4 h-4 text-yellow-500" />;
            case "DUE_DATE": return <Calendar className="w-4 h-4 text-red-500" />;
            case "BOARD_UPDATE": return <Layout className="w-4 h-4 text-purple-500" />;
            case "ALERT": return <AlertCircle className="w-4 h-4 text-orange-500" />;
            default: return <Bell className="w-4 h-4 text-neutral-500" />;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                title="Notificações"
            >
                <Bell className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">Notificações</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Marcar todas como lidas
                                </button>
                            )}
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition"
                                title={showSettings ? "Voltar para Notificações" : "Configurações"}
                            >
                                <Settings className="w-4 h-4 text-neutral-500" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ${!notification.readAt ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-900 dark:text-white font-medium">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-neutral-500">
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </span>
                                                {notification.relatedCardId && notification.relatedBoardId && (
                                                    <>
                                                        <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                                        <Link
                                                            href={`/board/${notification.relatedBoardId}?card=${notification.relatedCardId}`}
                                                            className="text-xs text-blue-600 hover:underline dark:text-blue-400 truncate max-w-[150px]"
                                                            onClick={() => {
                                                                if (!notification.readAt) {
                                                                    markAsRead([notification.id]);
                                                                }
                                                                setIsOpen(false);
                                                            }}
                                                        >
                                                            Ver card
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {!notification.readAt && (
                                            <button
                                                onClick={() => markAsRead([notification.id])}
                                                className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 hover:bg-blue-600 transition"
                                                title="Marcar como lida"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <NotificationSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
                </div>
            )}
        </div>
    );
}
