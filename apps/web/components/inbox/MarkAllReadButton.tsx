"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function markAllAsRead() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Todas as notificações foram marcadas como lidas");
        router.refresh();
      } else {
        toast.error("Erro ao marcar notificações");
      }
    } catch (err) {
      console.error("Mark all as read error:", err);
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={markAllAsRead}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <CheckCheck className="w-4 h-4" />
      {loading ? "Marcando..." : "Marcar todas como lidas"}
    </Button>
  );
}
