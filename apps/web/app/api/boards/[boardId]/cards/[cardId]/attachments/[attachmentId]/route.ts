import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
// TODO: Habilitar quando modelo Activity for criado no banco de dados
// import { logAttachmentDeleted } from "@/lib/activity";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * DELETE /api/boards/[boardId]/cards/[cardId]/attachments/[attachmentId]
 * Remove um anexo do card
 *
 * Se o arquivo foi salvo localmente (/uploads/), também deleta o arquivo físico
 * Se é URL externa, apenas remove o registro do banco
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string; attachmentId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(user.id, params.boardId, ["MEMBER", "ADMIN", "OWNER"]);

    // Verificar se o card existe e pertence ao board
    const card = await prisma.card.findFirst({
      where: {
        id: params.cardId,
        boardId: params.boardId
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o anexo
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.attachmentId },
      include: {
        card: {
          select: {
            id: true,
            boardId: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o anexo pertence ao card correto
    if (attachment.cardId !== params.cardId) {
      return NextResponse.json(
        { error: "Anexo não pertence a este card" },
        { status: 400 }
      );
    }

    // Salvar nome do arquivo para o log
    const fileName = attachment.fileName;
    const fileUrl = attachment.fileUrl;

    // Deletar registro do banco
    await prisma.attachment.delete({
      where: { id: params.attachmentId },
    });

    // Se for arquivo local (começa com /uploads/), deletar arquivo físico
    if (fileUrl.startsWith("/uploads/")) {
      try {
        // Construir caminho do arquivo
        const filePath = join(process.cwd(), fileUrl);

        // Verificar se arquivo existe e deletar
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (error) {
        // Log do erro, mas não falhar a operação
        // (registro já foi deletado do banco)
        console.error("Error deleting physical file:", error);
      }
    }

    // TODO: Habilitar quando modelo Activity for criado no banco de dados
    // Registrar atividade
    // await logAttachmentDeleted(
    //   params.boardId,
    //   params.cardId,
    //   user.id,
    //   fileName
    // );

    return NextResponse.json({
      success: true,
      message: "Anexo removido com sucesso",
    });

  } catch (err) {
    console.error("Delete attachment error:", err);
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    if (err instanceof Error && err.message === "Acesso negado") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao deletar anexo" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/boards/[boardId]/cards/[cardId]/attachments/[attachmentId]
 * Busca informações detalhadas de um anexo específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string; attachmentId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(user.id, params.boardId, ["MEMBER", "ADMIN", "OWNER"]);

    // Verificar se o card existe e pertence ao board
    const card = await prisma.card.findFirst({
      where: {
        id: params.cardId,
        boardId: params.boardId
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o anexo
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.attachmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
            boardId: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o anexo pertence ao card correto
    if (attachment.cardId !== params.cardId) {
      return NextResponse.json(
        { error: "Anexo não pertence a este card" },
        { status: 400 }
      );
    }

    return NextResponse.json({ attachment });

  } catch (err) {
    console.error("Get attachment error:", err);
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    if (err instanceof Error && err.message === "Acesso negado") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao buscar anexo" },
      { status: 500 }
    );
  }
}
