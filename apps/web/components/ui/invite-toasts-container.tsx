"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { InviteToast } from "./invite-toast";

interface Invite {
  id: string;
  boardId: string;
  board: {
    title: string;
  };
  invitedBy: {
    name: string | null;
    email: string;
  };
  createdAt: Date | string;
}

export function InviteToastsContainer() {
  const [invites, setInvites] = useState<Invite[]>([]);

  // Buscar convites pendentes ao carregar
  useEffect(() => {
    fetchPendingInvites();

    // Polling a cada 30 segundos para novos convites
    const interval = setInterval(fetchPendingInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPendingInvites() {
    try {
      const res = await fetch("/api/invites/pending", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (err) {
      console.error("Error fetching invites:", err);
    }
  }

  async function handleAccept(inviteId: string) {
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (res.ok) {
        // Remover convite da lista
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));

        // Recarregar página para atualizar boards
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao aceitar convite");
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      alert("Erro ao aceitar convite");
    }
  }

  async function handleDecline(inviteId: string) {
    try {
      const res = await fetch("/api/invites/decline", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (res.ok) {
        // Remover convite da lista
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao recusar convite");
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      alert("Erro ao recusar convite");
    }
  }

  function handleClose(inviteId: string) {
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
  }

  if (invites.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      <AnimatePresence mode="popLayout">
        {invites.map((invite) => (
          <InviteToast
            key={invite.id}
            invite={{
              id: invite.id,
              boardId: invite.boardId,
              boardTitle: invite.board.title,
              inviterName: invite.invitedBy.name,
              inviterEmail: invite.invitedBy.email,
              createdAt: invite.createdAt,
            }}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onClose={() => handleClose(invite.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
