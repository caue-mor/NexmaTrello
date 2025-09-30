import { NextResponse } from "next/server";

// TODO: Habilitar quando modelos Label, Attachment, etc existirem no banco
// A busca global atual tenta usar os seguintes modelos que não existem:
// - Label (linha 254-264 do código original)
// - Attachment (linha 269 do código original)
// - Campo 'order' em Card (linha 275 do código original)
//
// Para reativar:
// 1. Execute: npx prisma db push
// 2. Restaure o conteúdo original deste arquivo do git
// 3. Teste com: GET /api/search?q=teste

export async function GET() {
  return NextResponse.json(
    {
      error: "Funcionalidade de busca ainda não implementada no banco de dados",
      cards: [],
      clients: [],
      comments: [],
      total: 0
    },
    { status: 501 }
  );
}
