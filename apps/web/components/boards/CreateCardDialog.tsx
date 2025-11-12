"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Client {
  id: string;
  name: string;
  status: string;
}

export function CreateCardDialog({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [dueAt, setDueAt] = useState("");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch CSRF token
      fetch("/api/csrf", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setCsrf(data.csrf))
        .catch((err) => console.error("Erro ao buscar CSRF:", err));

      // Fetch clients
      fetch("/api/clients", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch((err) => console.error("Erro ao buscar clientes:", err));
    }
  }, [isOpen]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Refetch CSRF token before submission to ensure sync
      const csrfRes = await fetch("/api/csrf", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const freshCsrf = csrfData.csrf;

      const res = await fetch(`/api/boards/${boardId}/cards`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId,
          title,
          description: description || undefined,
          urgency,
          dueAt: dueAt || undefined,
          clientId: clientId || undefined,
          csrf: freshCsrf,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.reload();
      } else {
        // Handle Zod validation errors that return nested objects
        if (typeof data.error === 'string') {
          setError(data.error);
        } else if (data.error?.fieldErrors) {
          // Extract first field error from Zod validation
          const firstError = Object.values(data.error.fieldErrors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : "Erro de validação");
        } else if (data.error?.formErrors && Array.isArray(data.error.formErrors) && data.error.formErrors.length > 0) {
          setError(data.error.formErrors[0]);
        } else {
          setError("Erro ao criar card");
        }
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        className="w-full mt-3 p-2 text-sm text-neutral-600 hover:bg-neutral-200 rounded-lg transition"
        onClick={() => setIsOpen(true)}
      >
        + Adicionar card
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Criar Novo Card</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Título *
            </label>
            <Input
              id="title"
              placeholder="O que precisa ser feito?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Descrição
            </label>
            <textarea
              id="description"
              className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 min-h-[100px]"
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Urgência</label>
            <div className="grid grid-cols-4 gap-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((level) => {
                const labels = {
                  LOW: "Baixa",
                  MEDIUM: "Média",
                  HIGH: "Alta",
                  CRITICAL: "Crítica"
                };
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 transition ${
                      urgency === level
                        ? level === "CRITICAL"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : level === "HIGH"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : level === "MEDIUM"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-green-500 bg-green-50 text-green-700"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    {labels[level]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dueAt">
              Data de Vencimento
            </label>
            <Input
              id="dueAt"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="clientId">
              Cliente (opcional)
            </label>
            <select
              id="clientId"
              className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Nenhum cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.status}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Criando..." : "Criar Card"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}