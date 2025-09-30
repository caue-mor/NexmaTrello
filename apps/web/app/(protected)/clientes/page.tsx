import { requireAuth } from "@/lib/auth";

/**
 * TODO: Esta página está temporariamente desabilitada porque o modelo Client
 * não existe no banco de dados de produção.
 *
 * Para habilitar:
 * 1. Execute: npx prisma db push
 * 2. Descomente o código abaixo
 * 3. Descomente a importação dos componentes
 */

// import { prisma } from "@/lib/db";
// import { ClientsTable } from "@/components/clients/ClientsTable";
// import { CreateClientDialog } from "@/components/clients/CreateClientDialog";

export default async function ClientesPage() {
  const user = await requireAuth();

  // TODO: Descomentar quando modelo Client existir no banco
  // const clients = await prisma.client.findMany({
  //   orderBy: { createdAt: "desc" },
  //   include: {
  //     _count: {
  //       select: { cards: true },
  //     },
  //   },
  // });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Clientes</h1>
            <p className="text-neutral-600 mt-1">
              Funcionalidade temporariamente indisponível
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-semibold mb-2">Módulo em Manutenção</h2>
          <p className="text-neutral-600 mb-4">
            O módulo de clientes está sendo configurado no banco de dados de produção.
          </p>
          <p className="text-sm text-neutral-500">
            Esta funcionalidade estará disponível em breve. Entre em contato com o administrador para mais informações.
          </p>
        </div>

        {/* TODO: Descomentar quando modelo existir */}
        {/* <ClientsTable clients={clients} /> */}
      </div>
    </div>
  );
}
