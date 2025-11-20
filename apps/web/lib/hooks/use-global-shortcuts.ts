"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";

interface UseGlobalShortcutsProps {
    onOpenSearch?: () => void;
    onOpenCreateCard?: () => void;
    onOpenCreateBoard?: () => void;
    onToggleNotifications?: () => void;
}

export function useGlobalShortcuts({
    onOpenSearch,
    onOpenCreateCard,
    onOpenCreateBoard,
    onToggleNotifications,
}: UseGlobalShortcutsProps = {}) {
    const router = useRouter();

    // Ctrl/Cmd + K - Busca global
    useHotkeys("ctrl+k, cmd+k", (e) => {
        e.preventDefault();
        onOpenSearch?.();
    }, { enableOnFormTags: false });

    // C - Criar card (apenas quando não estiver em input)
    useHotkeys("c", () => {
        onOpenCreateCard?.();
    }, { enableOnFormTags: false });

    // B - Criar board
    useHotkeys("b", () => {
        onOpenCreateBoard?.();
    }, { enableOnFormTags: false });

    // N - Toggle notificações
    useHotkeys("n", () => {
        onToggleNotifications?.();
    }, { enableOnFormTags: false });

    // ? - Mostrar ajuda de atalhos
    useHotkeys("shift+/", (e) => {
        e.preventDefault();
        // TODO: Abrir modal de ajuda
        console.log("Atalhos disponíveis");
    }, { enableOnFormTags: false });

    // Esc - Fechar modais (implementado nos componentes individuais)

    // 1-9 - Navegar entre boards (implementar depois)
}
