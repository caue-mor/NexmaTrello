import { NextResponse } from "next/server";
import { z } from "zod";
import { registerSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { lucia } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { authRateLimit, getClientIp, checkRateLimit } from "@/lib/rate-limit";
import argon2 from "argon2";

export async function POST(req: Request) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(authRateLimit, ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Muitas tentativas. Tente novamente mais tarde.",
          resetAt: rateLimit.reset,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    // CSRF validation
    await assertCsrf(data.csrf);

    // Check if user already exists
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: Number(process.env.ARGON2_MEMORY ?? 19456),
      timeCost: Number(process.env.ARGON2_ITERATIONS ?? 2),
      parallelism: Number(process.env.ARGON2_PARALLELISM ?? 1),
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Adicionar automaticamente ao board "Trello Geral Nexma"
    const generalBoard = await prisma.board.findFirst({
      where: { title: "Trello Geral Nexma" },
      select: { id: true },
    });

    if (generalBoard) {
      await prisma.boardMember.create({
        data: {
          id: crypto.randomUUID(),
          boardId: generalBoard.id,
          userId: user.id,
          role: "MEMBER",
        },
      });
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });

    res.headers.set("Set-Cookie", sessionCookie.serialize());
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    if (err instanceof Error && err.message === "CSRF token inválido") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Erro ao registrar" },
      { status: 500 }
    );
  }
}