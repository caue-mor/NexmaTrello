import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding board templates...");

    const templates = [
        {
            title: "Kanban Básico",
            description: "Um quadro simples com colunas To Do, Doing e Done.",
            category: "Geral",
            columns: ["A Fazer", "Em Progresso", "Concluído"],
            isPublic: true,
        },
        {
            title: "Scrum Sprint",
            description: "Gerencie seus sprints com Backlog, Sprint Backlog, Em Desenvolvimento, Code Review e Done.",
            category: "Desenvolvimento",
            columns: ["Backlog", "Sprint Backlog", "Em Desenvolvimento", "Code Review", "Done"],
            isPublic: true,
        },
        {
            title: "Roadmap de Produto",
            description: "Planeje o futuro do seu produto com colunas por trimestre ou status.",
            category: "Produto",
            columns: ["Ideias", "Q1", "Q2", "Q3", "Q4", "Entregue"],
            isPublic: true,
        },
        {
            title: "Funil de Vendas",
            description: "Acompanhe seus leads desde o contato inicial até o fechamento.",
            category: "Vendas",
            columns: ["Leads", "Qualificação", "Proposta", "Negociação", "Fechado"],
            isPublic: true,
        },
        {
            title: "Calendário de Conteúdo",
            description: "Organize suas postagens de blog e redes sociais.",
            category: "Marketing",
            columns: ["Ideias", "Rascunho", "Revisão", "Agendado", "Publicado"],
            isPublic: true,
        },
    ];

    for (const template of templates) {
        await prisma.boardTemplate.create({
            data: template,
        });
    }

    console.log("Templates seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
