import { useState, useEffect } from "react";

interface Board {
  id: string;
  title: string;
  isOrgWide: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/boards", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar boards");
      }

      const data = await res.json();
      setBoards(data.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (title: string) => {
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar board");
      }

      const data = await res.json();
      await fetchBoards(); // Refresh list
      return data.board;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return {
    boards,
    loading,
    error,
    refresh: fetchBoards,
    createBoard,
  };
}