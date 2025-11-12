import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotesClient } from "@/components/notes/NotesClient";

export default async function NotesPage() {
  const { user } = await requireAuth();

  // Buscar notas do usuário
  const notes = await prisma.note.findMany({
    where: {
      OR: [
        { userId: user.id, scope: "PERSONAL" },
        {
          scope: "BOARD",
          board: {
            members: {
              some: { userId: user.id }
            }
          }
        }
      ]
    },
    include: {
      board: {
        select: {
          id: true,
          title: true
        }
      },
      card: {
        select: {
          id: true,
          title: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { isPinned: "desc" },
      { updatedAt: "desc" }
    ]
  });

  return <NotesClient initialNotes={notes} userId={user.id} />;
}
