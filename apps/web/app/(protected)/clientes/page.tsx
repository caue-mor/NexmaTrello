import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { CreateClientDialog } from "@/components/clients/CreateClientDialog";

export default async function ClientesPage() {
  const user = await requireAuth();

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { cards: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Clientes</h1>
            <p className="text-neutral-600 mt-1">
              Gerencie clientes e acompanhe o atendimento
            </p>
          </div>
          <CreateClientDialog />
        </div>

        <ClientsTable clients={clients} />
      </div>
    </div>
  );
}
