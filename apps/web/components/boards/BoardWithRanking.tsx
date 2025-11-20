"use client";

import { useState } from "react";
import { DraggableBoard } from "./DraggableBoard";
import { BoardRankingPanel } from "../gamification/BoardRankingPanel";
import { Trophy } from "lucide-react";

interface Column {
    id: string;
    title: string;
    isFixed?: boolean;
    cards: any[];
}

interface BoardWithRankingProps {
    boardId: string;
    userId: string;
    initialColumns: Column[];
}

export function BoardWithRanking({
    boardId,
    userId,
    initialColumns,
}: BoardWithRankingProps) {
    const [showRanking, setShowRanking] = useState(false);

    return (
        <>
            {/* Botão flutuante para abrir ranking */}
            {!showRanking && (
                <button
                    onClick={() => setShowRanking(true)}
                    className="fixed right-6 bottom-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
                    title="Ver Ranking"
                >
                    <Trophy className="w-6 h-6" />
                </button>
            )}

            {/* Board Kanban */}
            <DraggableBoard boardId={boardId} initialColumns={initialColumns} />

            {/* Painel de Ranking */}
            <BoardRankingPanel
                boardId={boardId}
                currentUserId={userId}
                isOpen={showRanking}
                onClose={() => setShowRanking(false)}
            />
        </>
    );
}
