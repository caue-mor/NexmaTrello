import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Buscar em paralelo
    const [boards, cards, comments] = await Promise.all([
      // Boards
      prisma.board.findMany({
        where: {
          title: { contains: query, mode: "insensitive" },
          OR: [
            { isOrgWide: true },
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        take: 5,
      }),
      // Cards
      prisma.card.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          column: {
            board: {
              OR: [
                { isOrgWide: true },
                { ownerId: user.id },
                { members: { some: { userId: user.id } } },
              ],
            },
          },
        },
        include: {
          column: {
            include: {
              board: {
                select: { id: true, title: true },
              },
            },
          },
        },
        take: 10,
      }),
      // Comments
      prisma.comment.findMany({
        where: {
          content: { contains: query, mode: "insensitive" },
          card: {
            column: {
              board: {
                OR: [
                  { isOrgWide: true },
                  { ownerId: user.id },
                  { members: { some: { userId: user.id } } },
                ],
              },
            },
          },
        },
        include: {
          card: {
            select: {
              id: true,
              title: true,
              column: {
                include: {
                  board: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
        take: 5,
      }),
    ]);

    // Formatar resultados
    const results = [
      ...boards.map((board) => ({
        id: board.id,
        type: "board",
        title: board.title,
        description: "Board",
        url: `/board/${board.id}`,
      })),
      ...cards.map((card) => ({
        id: card.id,
        type: "card",
        title: card.title,
        description: card.description,
        boardTitle: card.column.board.title,
        url: `/board/${card.column.board.id}?card=${card.id}`,
      })),
      ...comments.map((comment) => ({
        id: comment.id,
        type: "comment",
        title: comment.content,
        description: `Comentário em "${comment.card.title}"`,
        boardTitle: comment.card.column.board.title,
        url: `/board/${comment.card.column.board.id}?card=${comment.card.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
