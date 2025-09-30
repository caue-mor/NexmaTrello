"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

  const loadAvailableUsers = async () => {
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
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

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
        // Recarregar lista de usuários para refletir mudanças
        setTimeout(() => {
          setSuccess("");
          loadAvailableUsers();
        }, 2000);
      } else {
        if (res.status === 409) {
          // Conflict - convite já existe ou usuário já é membro
          setError(data.error || "Este usuário já foi convidado ou já é membro");
          // Recarregar lista para atualizar status
          setTimeout(() => {
            setError("");
            loadAvailableUsers();
          }, 3000);
        } else {
          setError(data.error || "Erro ao enviar convite");
        }
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Convidar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Adicione membros ao seu board por nome ou email
          </DialogDescription>
        </DialogHeader>

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
            {success}
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
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {(user.name || user.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Já é membro
                  </Badge>
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
                      Membro
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user.email, "ADMIN")}
                      disabled={loading}
                      className="text-xs bg-purple-600 hover:bg-purple-700"
                      title="Admin: Vê performance geral e de todos os membros"
                    >
                      Admin
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}