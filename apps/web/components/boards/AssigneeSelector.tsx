"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface AssigneeSelectorProps {
  cardId: string;
  boardId: string;
  currentAssignees: User[];
  onUpdate: () => void;
}

export function AssigneeSelector({
  cardId,
  boardId,
  currentAssignees,
  onUpdate,
}: AssigneeSelectorProps) {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar apenas MEMBROS do board
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch(`/api/users/available?boardId=${boardId}&onlyMembers=true`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setAvailableUsers(data.users || []);
        }
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
      }
    }
    loadUsers();
  }, [boardId]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = availableUsers.filter((user) => {
    const term = emailInput.toLowerCase();
    const name = (user.name || "").toLowerCase();
    const email = user.email.toLowerCase();

    // Não mostrar usuários já atribuídos
    const isAlreadyAssigned = currentAssignees.some((a) => a.id === user.id);

    return !isAlreadyAssigned && (name.includes(term) || email.includes(term));
  });

  async function handleSelectUser(userEmail: string) {
    setEmailInput(userEmail);
    setShowSuggestions(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Usuário atribuído com sucesso!");
        setEmailInput("");
        onUpdate();
      } else {
        toast.error(data.error || "Erro ao atribuir usuário");
        console.error("Erro ao atribuir:", data);
      }
    } catch (err) {
      toast.error("Erro de conexão");
      console.error("Erro ao atribuir:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Digite um email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Usuário atribuído com sucesso!");
        setEmailInput("");
        // Recarregar o card para mostrar o novo assignee
        onUpdate();
      } else {
        toast.error(data.error || "Erro ao atribuir usuário");
        console.error("Erro ao atribuir:", data);
      }
    } catch (err) {
      toast.error("Erro de conexão");
      console.error("Erro ao atribuir:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      const res = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/assignees/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.ok) {
        toast.success("Usuário removido");
        onUpdate();
      } else {
        toast.error("Erro ao remover usuário");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Pessoas Atribuídas</h4>
        {currentAssignees.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma pessoa atribuída</p>
        ) : (
          <div className="space-y-2">
            {currentAssignees.map((assignee) => (
              <div
                key={assignee.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {(assignee.name || assignee.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {assignee.name || assignee.email}
                    </p>
                    {assignee.name && (
                      <p className="text-xs text-neutral-500">{assignee.email}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(assignee.id)}
                  className="text-xs text-red-600 hover:text-red-700 transition"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2">Atribuir Pessoa</h4>
        <form onSubmit={handleAssign} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Digite o nome ou email..."
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setShowSuggestions(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (emailInput.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={loading}
            />

            {/* Dropdown de sugestões */}
            {showSuggestions && filteredUsers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user.email)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition text-left border-b border-neutral-100 last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Mensagem quando não encontra ninguém */}
            {showSuggestions && emailInput.trim().length > 0 && filteredUsers.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-center text-sm text-neutral-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !emailInput.trim()}
            size="sm"
          >
            {loading ? "..." : "Atribuir"}
          </Button>
        </form>
      </div>
    </div>
  );
}