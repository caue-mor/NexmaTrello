import { NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema } from "@/lib/validators";
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
    const data = loginSchema.parse(body);

    // CSRF validation
    await assertCsrf(data.csrf);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await argon2.verify(user.passwordHash, data.password);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Conta desativada" },
        { status: 403 }
      );
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", sessionCookie.serialize());

    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    if (err instanceof Error && err.message === "CSRF token inválido") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}