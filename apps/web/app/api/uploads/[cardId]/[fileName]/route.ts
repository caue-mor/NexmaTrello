import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/uploads/[cardId]/[fileName]
 * Serve arquivos estáticos da pasta uploads/
 * Requer autenticação para acesso
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string; fileName: string } }
) {
  try {
    // Requer autenticação para acessar arquivos
    await requireAuth();

    const { cardId, fileName } = params;

    // Sanitizar fileName para prevenir path traversal
    const sanitizedFileName = fileName.replace(/\.\./g, "");

    // Construir caminho do arquivo
    const filePath = join(process.cwd(), "uploads", cardId, sanitizedFileName);

    // Verificar se arquivo existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Ler arquivo
    const fileBuffer = await readFile(filePath);

    // Detectar MIME type baseado na extensão
    const ext = sanitizedFileName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Imagens
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      // Documentos
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Texto
      txt: "text/plain",
      csv: "text/csv",
      // Compactados
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      // Outros
      json: "application/json",
      xml: "application/xml",
    };

    const contentType = mimeTypes[ext || ""] || "application/octet-stream";

    // Retornar arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${sanitizedFileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

  } catch (err) {
    console.error("Serve file error:", err);
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao carregar arquivo" },
      { status: 500 }
    );
  }
}
