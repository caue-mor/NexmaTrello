"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteBoardButton({ boardId, boardTitle }: { boardId: string; boardTitle: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Board excluído com sucesso!", {
          description: `O board "${boardTitle}" foi removido permanentemente`,
          duration: 3000,
        });

        // Redirecionar para dashboard após 1 segundo
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        if (res.status === 403) {
          toast.error(data.error, {
            description: data.boardOwner
              ? `Somente ${data.boardOwner} pode excluir este board`
              : "Você não tem permissão para excluir este board",
            duration: 5000,
          });
        } else {
          toast.error(data.error || "Erro ao excluir board");
        }
        setShowConfirm(false);
      }
    } catch (err) {
      console.error("Delete board error:", err);
      toast.error("Erro de conexão ao excluir board");
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        Excluir Grupo
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
      >
        Cancelar
      </Button>
      <Button
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
      </Button>
    </div>
  );
}