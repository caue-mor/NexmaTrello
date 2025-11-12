import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const noteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { noteId } = params;

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId: user.id },
          {
            board: {
              members: {
                some: { userId: user.id },
              },
            },
          },
          {
            card: {
              board: {
                members: {
                  some: { userId: user.id },
                },
              },
            },
          },
        ],
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Nota não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (err) {
    console.error("Get note error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar nota" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { noteId } = params;
    const body = await req.json();
    const data = noteUpdateSchema.parse(body);

    // Check ownership
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id, // Only author can edit
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Nota não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data,
      include: {
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedNote);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    console.error("Update note error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar nota" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { noteId } = params;

    // Check ownership
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id, // Only author can delete
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Nota não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete note error:", err);
    return NextResponse.json(
      { error: "Erro ao deletar nota" },
      { status: 500 }
    );
  }
}
