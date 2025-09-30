import { NextResponse } from "next/server";

/**
 * GET /api/boards/[boardId]/activities
 *
 * TODO: Esta funcionalidade está temporariamente desabilitada porque o modelo Activity
 * ainda não existe no banco de dados. Será habilitada quando o modelo for criado.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Funcionalidade ainda não implementada no banco de dados" },
    { status: 501 }
  );
}
