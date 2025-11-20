"use client";

import { useState, useEffect } from "react";
import { X, Bell, Mail, Volume2, AtSign, UserPlus, MessageSquare, Calendar, Layout } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Assuming we have a Switch component or I'll use a simple HTML checkbox styled

interface NotificationPreferences {
    emailEnabled: boolean;
    pushEnabled: boolean;
    soundEnabled: boolean;
    mentions: boolean;
    assignments: boolean;
    comments: boolean;
    deadlines: boolean;
    boardUpdates: boolean;
}

interface NotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchPreferences();
        }
    }, [isOpen]);

    const fetchPreferences = async () => {
        try {
            const res = await fetch("/api/notifications/preferences");
            if (res.ok) {
                const data = await res.json();
                setPreferences(data.preferences);
            }
        } catch (error) {
            console.error("Error fetching preferences:", error);
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!preferences) return;

        // Optimistic update
        setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));

        try {
            await fetch("/api/notifications/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });
        } catch (error) {
            console.error("Error updating preference:", error);
            // Revert on error
            fetchPreferences();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                        Configurações de Notificação
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : preferences ? (
                        <div className="space-y-6">
                            {/* Canais */}
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                                    Canais
                                </h4>
                                <div className="space-y-3">
                                    <PreferenceItem
                                        icon={<Mail className="w-4 h-4" />}
                                        label="Email"
                                        description="Receber resumo diário por email"
                                        checked={preferences.emailEnabled}
                                        onChange={(v) => updatePreference("emailEnabled", v)}
                                    />
                                    <PreferenceItem
                                        icon={<Bell className="w-4 h-4" />}
                                        label="Push"
                                        description="Notificações no navegador"
                                        checked={preferences.pushEnabled}
                                        onChange={(v) => updatePreference("pushEnabled", v)}
                                    />
                                    <PreferenceItem
                                        icon={<Volume2 className="w-4 h-4" />}
                                        label="Sons"
                                        description="Tocar som ao receber notificação"
                                        checked={preferences.soundEnabled}
                                        onChange={(v) => updatePreference("soundEnabled", v)}
                                    />
                                </div>
                            </div>

                            {/* Tipos */}
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                                    Notificar sobre
                                </h4>
                                <div className="space-y-3">
                                    <PreferenceItem
                                        icon={<AtSign className="w-4 h-4" />}
                                        label="Menções"
                                        description="Quando alguém mencionar você (@voce)"
                                        checked={preferences.mentions}
                                        onChange={(v) => updatePreference("mentions", v)}
                                    />
                                    <PreferenceItem
                                        icon={<UserPlus className="w-4 h-4" />}
                                        label="Atribuições"
                                        description="Quando você for atribuído a um card"
                                        checked={preferences.assignments}
                                        onChange={(v) => updatePreference("assignments", v)}
                                    />
                                    <PreferenceItem
                                        icon={<MessageSquare className="w-4 h-4" />}
                                        label="Comentários"
                                        description="Novos comentários em cards que você segue"
                                        checked={preferences.comments}
                                        onChange={(v) => updatePreference("comments", v)}
                                    />
                                    <PreferenceItem
                                        icon={<Calendar className="w-4 h-4" />}
                                        label="Prazos"
                                        description="Lembretes de datas de entrega próximas"
                                        checked={preferences.deadlines}
                                        onChange={(v) => updatePreference("deadlines", v)}
                                    />
                                    <PreferenceItem
                                        icon={<Layout className="w-4 h-4" />}
                                        label="Atualizações do Board"
                                        description="Mudanças gerais nos boards (movimentações, etc)"
                                        checked={preferences.boardUpdates}
                                        onChange={(v) => updatePreference("boardUpdates", v)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-neutral-500 py-8">
                            Erro ao carregar configurações
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PreferenceItem({
    icon,
    label,
    description,
    checked,
    onChange,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className="mt-1 text-neutral-500">{icon}</div>
                <div>
                    <p className="font-medium text-sm text-neutral-900 dark:text-white">{label}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
                </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}
