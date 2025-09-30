"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"NORMAL" | "NEUTRO" | "URGENTE" | "EMERGENCIA">("NORMAL");
  const [lead, setLead] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status, lead }),
      });

      if (!res.ok) throw new Error("Erro ao criar cliente");

      setOpen(false);
      setName("");
      setStatus("NORMAL");
      setLead(0);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo Cliente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="NORMAL">Normal</option>
              <option value="NEUTRO">Neutro</option>
              <option value="URGENTE">Urgente</option>
              <option value="EMERGENCIA">Emergência</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lead</label>
            <input
              type="number"
              value={lead}
              onChange={(e) => setLead(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Quantidade de leads"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
