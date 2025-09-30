"use client";

import { useState } from "react";
import { ClientDetailsModal } from "./ClientDetailsModal";

interface Client {
  id: string;
  name: string;
  status: string;
  lead: number;
  _count: {
    cards: number;
  };
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const statusColors = {
    NORMAL: "bg-blue-100 text-blue-700",
    NEUTRO: "bg-gray-100 text-gray-700",
    URGENTE: "bg-orange-100 text-orange-700",
    EMERGENCIA: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    NORMAL: "Normal",
    NEUTRO: "Neutro",
    URGENTE: "Urgente",
    EMERGENCIA: "Emergência",
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
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
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
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        statusColors[client.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[client.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{client.lead}</td>
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
