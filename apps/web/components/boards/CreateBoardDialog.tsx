"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSelector } from "./TemplateSelector";

export function CreateBoardDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/csrf", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setCsrf(data.csrf))
        .catch((err) => console.error("Erro ao buscar CSRF:", err));
    }
  }, [isOpen]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Refetch CSRF token before submission
      const csrfRes = await fetch("/api/csrf", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const freshCsrf = csrfData.csrf;

      const res = await fetch("/api/boards", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, csrf: freshCsrf }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || "Erro ao criar grupo");
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>+ Novo Grupo</Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Criar Novo Grupo</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </div>

        <Tabs defaultValue="blank" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="blank">Em Branco</TabsTrigger>
            <TabsTrigger value="template">Usar Modelo</TabsTrigger>
          </TabsList>

          <TabsContent value="blank">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Nome do Grupo
                </label>
                <Input
                  id="title"
                  placeholder="Ex: Marketing, Vendas, Design..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
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
                  {loading ? "Criando..." : "Criar Grupo"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="template">
            <TemplateSelector onClose={() => setIsOpen(false)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}