"use client";

import { useState } from "react";
import { ClientDetailsModal } from "./ClientDetailsModal";

interface Client {
  id: string;
  name: string;
  status: string;
  onboardStatus: string;
  lead: number;
  _count: {
    cards: number;
  };
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<{ clientId: string; value: string } | null>(null);

  const statusColors = {
    NORMAL: "bg-blue-100 text-blue-700",
    NEUTRO: "bg-gray-100 text-gray-700",
    URGENTE: "bg-orange-100 text-orange-700",
    EMERGENCIA: "bg-red-100 text-red-700",
  };

  const onboardColors = {
    ONBOARD: "bg-yellow-100 text-yellow-700",
    ATIVO: "bg-green-100 text-green-700",
    INATIVO: "bg-red-100 text-red-700",
  };

  const handleUpdateField = async (clientId: string, field: string, value: any) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(`Erro ao atualizar ${field}:`, err);
    }
  };

  const handleLeadBlur = (clientId: string) => {
    if (editingLead && editingLead.clientId === clientId) {
      const newValue = parseInt(editingLead.value) || 0;
      handleUpdateField(clientId, "lead", newValue);
      setEditingLead(null);
    }
  };

  const handleLeadKeyDown = (e: React.KeyboardEvent, clientId: string) => {
    if (e.key === "Enter") {
      handleLeadBlur(clientId);
    } else if (e.key === "Escape") {
      setEditingLead(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Onboard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Cards
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                  Nenhum cliente cadastrado
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-neutral-50 cursor-pointer transition"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={client.status}
                      onChange={(e) => handleUpdateField(client.id, "status", e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer transition hover:opacity-80 ${
                        statusColors[client.status as keyof typeof statusColors]
                      }`}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="NEUTRO">Neutro</option>
                      <option value="URGENTE">Urgente</option>
                      <option value="EMERGENCIA">Emergência</option>
                    </select>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={client.onboardStatus}
                      onChange={(e) => handleUpdateField(client.id, "onboardStatus", e.target.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer transition hover:opacity-80 ${
                        onboardColors[client.onboardStatus as keyof typeof onboardColors]
                      }`}
                    >
                      <option value="ONBOARD">Onboard</option>
                      <option value="ATIVO">Ativo</option>
                      <option value="INATIVO">Inativo</option>
                    </select>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {editingLead?.clientId === client.id ? (
                      <input
                        type="number"
                        value={editingLead.value}
                        onChange={(e) => setEditingLead({ clientId: client.id, value: e.target.value })}
                        onBlur={() => handleLeadBlur(client.id)}
                        onKeyDown={(e) => handleLeadKeyDown(e, client.id)}
                        className="w-16 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-neutral-600 cursor-pointer hover:text-blue-600 transition"
                        onClick={() => setEditingLead({ clientId: client.id, value: client.lead.toString() })}
                      >
                        {client.lead}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                      {client._count.cards} cards
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedClientId && (
        <ClientDetailsModal
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </>
  );
}
