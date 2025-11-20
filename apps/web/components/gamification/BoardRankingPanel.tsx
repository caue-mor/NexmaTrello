"use client";

import { useState, useEffect } from "react";
import { X, Trophy, TrendingUp, Award } from "lucide-react";

interface UserRanking {
    userId: string;
    name: string | null;
    email: string;
    level: number;
    xp: number;
    tasksCompleted: number;
    cardsCompleted: number;
}

interface BoardRankingPanelProps {
    boardId: string;
    currentUserId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function BoardRankingPanel({
    boardId,
    currentUserId,
    isOpen,
    onClose,
}: BoardRankingPanelProps) {
    const [ranking, setRanking] = useState<UserRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchRanking();
        }
    }, [isOpen, boardId]);

    async function fetchRanking() {
        try {
            setLoading(true);
            const response = await fetch(`/api/boards/${boardId}/ranking`);
            if (response.ok) {
                const data = await response.json();
                setRanking(data.ranking || []);
            }
        } catch (error) {
            console.error("Error fetching ranking:", error);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    const currentUserRank = ranking.findIndex((u) => u.userId === currentUserId);
    const currentUser = ranking[currentUserRank];

    return (
        <div className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-lg">Ranking do Board</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-neutral-200 rounded transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading ? (
                    <div className="text-center py-8 text-neutral-500">
                        Carregando ranking...
                    </div>
                ) : (
                    <>
                        {/* Meu Progresso */}
                        {currentUser && (
                            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-4 border-2 border-purple-300">
                                <div className="flex items-center gap-2 mb-3">
                                    <Award className="w-5 h-5 text-purple-700" />
                                    <h3 className="font-bold text-purple-900">Seu Progresso</h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-purple-800">Posição</span>
                                        <span className="font-bold text-2xl text-purple-900">
                                            #{currentUserRank + 1}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-purple-800">Nível</span>
                                        <span className="font-bold text-lg text-purple-900">
                                            {currentUser.level}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between text-xs text-purple-800 mb-1">
                                            <span>XP</span>
                                            <span>{currentUser.xp} / {(currentUser.level + 1) * 500}</span>
                                        </div>
                                        <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                                                style={{
                                                    width: `${(currentUser.xp / ((currentUser.level + 1) * 500)) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-300">
                                        <div className="text-center">
                                            <p className="text-xs text-purple-700">Tarefas</p>
                                            <p className="font-bold text-purple-900">{currentUser.tasksCompleted}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-purple-700">Cards</p>
                                            <p className="font-bold text-purple-900">{currentUser.cardsCompleted}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top 3 */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                                <h3 className="font-bold text-neutral-900">Top Contribuidores</h3>
                            </div>

                            <div className="space-y-2">
                                {ranking.slice(0, 3).map((user, index) => {
                                    const isCurrentUser = user.userId === currentUserId;
                                    const medals = ["🥇", "🥈", "🥉"];

                                    return (
                                        <div
                                            key={user.userId}
                                            className={`p-3 rounded-lg border-2 transition ${isCurrentUser
                                                    ? "bg-purple-50 border-purple-300"
                                                    : "bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{medals[index]}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">
                                                        {user.name || user.email.split("@")[0]}
                                                        {isCurrentUser && (
                                                            <span className="ml-2 text-xs text-purple-600">(Você)</span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-neutral-600 mt-1">
                                                        <span>Nv. {user.level}</span>
                                                        <span>•</span>
                                                        <span>{user.xp} XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Outros usuários */}
                        {ranking.length > 3 && (
                            <div>
                                <h3 className="font-bold text-neutral-900 mb-3 text-sm">
                                    Outros Membros
                                </h3>
                                <div className="space-y-1">
                                    {ranking.slice(3).map((user, index) => {
                                        const isCurrentUser = user.userId === currentUserId;
                                        const position = index + 4;

                                        return (
                                            <div
                                                key={user.userId}
                                                className={`p-2 rounded-lg text-sm ${isCurrentUser
                                                        ? "bg-purple-50 border border-purple-200"
                                                        : "hover:bg-neutral-50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neutral-500 font-mono text-xs w-6">
                                                        #{position}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-xs">
                                                            {user.name || user.email.split("@")[0]}
                                                            {isCurrentUser && (
                                                                <span className="ml-1 text-purple-600">(Você)</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-neutral-500">
                                                        Nv. {user.level}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {ranking.length === 0 && !loading && (
                            <div className="text-center py-8 text-neutral-500">
                                Nenhum membro com estatísticas ainda
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
