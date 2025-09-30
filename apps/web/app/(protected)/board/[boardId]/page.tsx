import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateColumnDialog } from "@/components/boards/CreateColumnDialog";
import { InviteMemberDialog } from "@/components/boards/InviteMemberDialog";
import { DraggableBoard } from "@/components/boards/DraggableBoard";

async function getBoard(boardId: string, userId: string) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { isOrgWide: true },
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            include: {
              checklists: {
                include: {
                  items: true,
                },
              },
              assignees: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return board;
}

export default async function BoardPage({
  params,
}: {
  params: { boardId: string };
}) {
  const user = await requireAuth();
  const board = await getBoard(params.boardId, user.id);

  if (!board) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{board.title}</h1>
              <p className="text-sm text-neutral-600">
                {board.members.length} membros • {board.columns.length} colunas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <InviteMemberDialog boardId={board.id} />
            <CreateColumnDialog boardId={board.id} />
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {board.columns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">
                Este board ainda não tem colunas
              </p>
              <CreateColumnDialog boardId={board.id} />
            </div>
          ) : (
            <DraggableBoard boardId={board.id} initialColumns={board.columns} />
          )}
        </div>
      </div>
    </div>
  );
}