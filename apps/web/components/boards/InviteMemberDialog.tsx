"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string | null;
  email: string;
  isMember: boolean;
}

export function InviteMemberDialog({ boardId }: { boardId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  async function loadAvailableUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/available?boardId=${boardId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || "Erro ao carregar usuários");
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(userEmail: string, role: "ADMIN" | "MEMBER") {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, email: userEmail, role }),
      });

      const data = await res.json();

      if (res.ok) {
        const roleText = role === "ADMIN" ? "Admin" : "Membro";
        setSuccess(`Convite enviado para ${userEmail} como ${roleText}!`);
        // Remover usuário da lista
        setUsers(users.filter((u) => u.email !== userEmail));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Erro ao enviar convite");
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Convidar
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4">Convidar Membro</h2>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">
            ✓ {success}
          </div>
        )}

        {/* Users list */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {loading && users.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              {searchTerm
                ? "Nenhum usuário encontrado"
                : "Nenhum usuário disponível para convidar"}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {user.name || user.email}
                    </p>
                    {user.name && (
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    )}
                  </div>
                </div>
                {user.isMember ? (
                  <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
                    ✓ Já é membro
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvite(user.email, "MEMBER")}
                      disabled={loading}
                      className="text-xs"
                      title="Membro: Vê apenas sua própria performance"
                    >
                      👤 Membro
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user.email, "ADMIN")}
                      disabled={loading}
                      className="text-xs bg-purple-600 hover:bg-purple-700"
                      title="Admin: Vê performance geral e de todos os membros"
                    >
                      ⭐ Admin
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Close button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(false)}
        >
          Fechar
        </Button>
      </div>
    </div>
  );
}