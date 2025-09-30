import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { assertBoardRole } from "@/lib/rbac";
// TODO: Habilitar quando modelo Activity for criado no banco de dados
// import { logAttachmentAdded } from "@/lib/activity";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Schema de validação flexível para aceitar URL ou base64
const attachmentCreateSchema = z.object({
  fileName: z.string().min(1, "Nome do arquivo obrigatório"),
  fileUrl: z.string().url("URL inválida").optional(),
  fileBase64: z.string().optional(),
  mimeType: z.string().min(1, "Tipo MIME obrigatório"),
}).refine(
  (data) => data.fileUrl || data.fileBase64,
  { message: "Forneça fileUrl ou fileBase64" }
);

/**
 * POST /api/boards/[boardId]/cards/[cardId]/attachments
 * Cria um novo anexo no card
 *
 * Aceita dois formatos:
 * 1. URL externa (Google Drive, Dropbox, etc): { fileName, fileUrl, mimeType }
 * 2. Base64: { fileName, fileBase64, mimeType } - salva em /uploads/[cardId]/
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
) {
  try {
    const user = await requireAuth();
    await assertBoardRole(user.id, params.boardId, ["MEMBER", "ADMIN", "OWNER"]);

    const body = await req.json();
    const data = attachmentCreateSchema.parse(body);

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

    let finalFileUrl: string;
    let fileSize: number;

    // Se recebeu base64, salvar localmente
    if (data.fileBase64) {
      try {
        // Remover prefixo "data:image/png;base64," se existir
        const base64Data = data.fileBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        fileSize = buffer.length;

        // Criar estrutura de pastas: uploads/[cardId]/
        const uploadsDir = join(process.cwd(), "uploads", params.cardId);

        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        // Gerar nome único: timestamp-filename
        const timestamp = Date.now();
        const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
        const filePath = join(uploadsDir, uniqueFileName);

        // Salvar arquivo
        await writeFile(filePath, buffer);

        // URL relativa para acesso
        finalFileUrl = `/uploads/${params.cardId}/${uniqueFileName}`;

      } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json(
          { error: "Erro ao salvar arquivo" },
          { status: 500 }
        );
      }

    } else if (data.fileUrl) {
      // Usar URL fornecida (Google Drive, Dropbox, etc)
      finalFileUrl = data.fileUrl;

      // Tentar estimar tamanho através de HEAD request (opcional)
      try {
        const headResponse = await fetch(data.fileUrl, { method: "HEAD" });
        const contentLength = headResponse.headers.get("content-length");
        fileSize = contentLength ? parseInt(contentLength, 10) : 0;
      } catch {
        // Se falhar, assumir tamanho 0
        fileSize = 0;
      }
    } else {
      return NextResponse.json(
        { error: "Forneça fileUrl ou fileBase64" },
        { status: 400 }
      );
    }

    // Criar registro no banco
    const attachment = await prisma.attachment.create({
      data: {
        cardId: params.cardId,
        fileName: data.fileName,
        fileUrl: finalFileUrl,
        fileSize,
        mimeType: data.mimeType,
        uploadedBy: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Habilitar quando modelo Activity for criado no banco de dados
    // Registrar atividade
    // await logAttachmentAdded(
    //   params.boardId,
    //   params.cardId,
    //   user.id,
    //   data.fileName
    // );

    return NextResponse.json({ attachment }, { status: 201 });

  } catch (err) {
    console.error("Create attachment error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
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
      { error: "Erro ao criar anexo" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/boards/[boardId]/cards/[cardId]/attachments
 * Lista todos os anexos de um card
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string; cardId: string } }
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

    // Buscar todos os anexos do card
    const attachments = await prisma.attachment.findMany({
      where: { cardId: params.cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });

  } catch (err) {
    console.error("Get attachments error:", err);
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
      { error: "Erro ao carregar anexos" },
      { status: 500 }
    );
  }
}
