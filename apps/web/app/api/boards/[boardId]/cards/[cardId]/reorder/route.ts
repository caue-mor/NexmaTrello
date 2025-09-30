import { NextResponse } from "next/server";

/**
 * TODO: Esta API está temporariamente desabilitada porque o campo Card.order
 * não existe no banco de dados de produção.
 *
 * Para habilitar:
 * 1. Execute: npx prisma migrate dev --name add_card_order_field
 * 2. Ou: npx prisma db push
 * 3. Descomente o código abaixo
 */

// import { getSession } from "@/lib/auth";
// import { prisma } from "@/lib/db";
// import { cardReorderSchema } from "@/lib/validators";
// import { assertBoardRole } from "@/lib/rbac";
// import { z } from "zod";

/**
 * PUT /api/boards/[boardId]/cards/[cardId]/reorder
 *
 * Reordena um card dentro da mesma coluna ou move para outra coluna
 */
export async function PUT() {
  return NextResponse.json(
    { error: "Funcionalidade de reordenação ainda não implementada no banco de dados" },
    { status: 501 }
  );
}

// TODO: Descomentar quando campo Card.order existir no banco
// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ boardId: string; cardId: string }> | { boardId: string; cardId: string } }
// ) {
//   try {
//     // Autenticação
//     const { user } = await getSession();
//     if (!user) {
//       return NextResponse.json({ error: "unauthorized" }, { status: 401 });
//     }
//
//     const resolvedParams = await Promise.resolve(params);
//     const { boardId, cardId } = resolvedParams;
//
//     // Verificar acesso ao board
//     await assertBoardRole(boardId, user.id);
//
//     // Validar body
//     const body = await req.json();
//     const data = cardReorderSchema.parse(body);

//
//     // Buscar card atual
//     const currentCard = await prisma.card.findFirst({
//       where: {
//         id: cardId,
//         boardId,
//       },
//       include: {
//         column: {
//           select: {
//             id: true,
//             title: true,
//           },
//         },
//       },
//     });
//
//     if (!currentCard) {
//       return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
//     }
//
//     const targetColumnId = data.columnId || currentCard.columnId;
//     const newOrder = data.order;
//     const isChangingColumn = targetColumnId !== currentCard.columnId;
//
//     // Executar operação em transação
//     await prisma.$transaction(async (tx) => {
//       if (isChangingColumn) {
//         // CENÁRIO 1: Movendo para outra coluna
//
//         // 1. Decrementar order dos cards na coluna antiga (após a posição atual)
//         await tx.card.updateMany({
//           where: {
//             columnId: currentCard.columnId,
//             order: { gt: currentCard.order },
//           },
//           data: {
//             order: {
//               decrement: 1,
//             },
//           },
//         });
//
//         // 2. Incrementar order dos cards na coluna nova (>= nova posição)
//         await tx.card.updateMany({
//           where: {
//             columnId: targetColumnId,
//             order: { gte: newOrder },
//           },
//           data: {
//             order: {
//               increment: 1,
//             },
//           },
//         });
//
//         // 3. Mover o card para a nova coluna e posição
//         await tx.card.update({
//           where: { id: cardId },
//           data: {
//             columnId: targetColumnId,
//             order: newOrder,
//           },
//         });
//
//         // 4. Registrar atividade de movimento
//         const newColumn = await tx.column.findUnique({
//           where: { id: targetColumnId },
//           select: { title: true },
//         });
//
//         // if (newColumn) {
//         //   await logCardMoved(
//         //     boardId,
//         //     cardId,
//         //     user.id,
//         //     currentCard.column.title,
//         //     newColumn.title
//         //   );
//         // }
//       } else {
//         // CENÁRIO 2: Reordenando dentro da mesma coluna
//
//         const oldOrder = currentCard.order;
//
//         if (oldOrder === newOrder) {
//           // Nada a fazer, mesma posição
//           return;
//         }
//
//         if (newOrder > oldOrder) {
//           // Movendo para baixo: decrementar cards entre oldOrder e newOrder
//           await tx.card.updateMany({
//             where: {
//               columnId: targetColumnId,
//               order: {
//                 gt: oldOrder,
//                 lte: newOrder,
//               },
//             },
//             data: {
//               order: {
//                 decrement: 1,
//               },
//             },
//           });
//         } else {
//           // Movendo para cima: incrementar cards entre newOrder e oldOrder
//           await tx.card.updateMany({
//             where: {
//               columnId: targetColumnId,
//               order: {
//                 gte: newOrder,
//                 lt: oldOrder,
//               },
//             },
//             data: {
//               order: {
//                 increment: 1,
//               },
//             },
//           });
//         }
//
//         // Atualizar posição do card
//         await tx.card.update({
//           where: { id: cardId },
//           data: { order: newOrder },
//         });
//       }
//     });
//
//     // Buscar card atualizado com dados completos
//     const updatedCard = await prisma.card.findUnique({
//       where: { id: cardId },
//       include: {
//         column: {
//           select: {
//             id: true,
//             title: true,
//           },
//         },
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         assignees: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//               },
//             },
//           },
//         },
//         checklists: {
//           include: {
//             items: true,
//           },
//         },
//       },
//     });
//
//     return NextResponse.json({
//       card: updatedCard,
//       message: isChangingColumn ? "Card movido com sucesso" : "Card reordenado com sucesso"
//     });
//
//   } catch (err) {
//     if (err instanceof z.ZodError) {
//       return NextResponse.json({ error: err.flatten() }, { status: 400 });
//     }
//
//     if (err instanceof Error && err.message === "Acesso negado") {
//       return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
//     }
//
//     console.error("Reorder card error:", err);
//     return NextResponse.json(
//       { error: "Erro ao reordenar card" },
//       { status: 500 }
//     );
//   }
// }
