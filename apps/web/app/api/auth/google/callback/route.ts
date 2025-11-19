import { getGoogleOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth"; // Assumindo que podemos usar isso em API routes ou adaptar
import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/lib/auth"; // Importar lucia diretamente para validar sessão manualmente se necessário

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(new URL("/calendar?error=access_denied", req.url));
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    try {
        // Validar sessão usando cookies
        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) {
            console.error("No cookies in request");
            return NextResponse.redirect(new URL("/login?error=no_session", req.url));
        }

        // Extrair sessionId do cookie
        const sessionCookie = req.cookies.get(lucia.sessionCookieName);
        const sessionId = sessionCookie?.value ?? null;

        if (!sessionId) {
            console.error("No session ID found in cookies");
            return NextResponse.redirect(new URL("/login?error=no_session", req.url));
        }

        const { user } = await lucia.validateSession(sessionId);
        if (!user) {
            console.error("Invalid session");
            return NextResponse.redirect(new URL("/login?error=invalid_session", req.url));
        }

        console.log("User authenticated:", user.id);

        const oauth2Client = getGoogleOAuthClient();
        if (!oauth2Client) {
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        const { tokens } = await oauth2Client.getToken(code);

        await prisma.googleToken.upsert({
            where: { userId: user.id },
            update: {
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token || undefined, // Só atualiza se vier novo
                expiryDate: tokens.expiry_date,
            },
            create: {
                userId: user.id,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
                expiryDate: tokens.expiry_date,
            },
        });

        return NextResponse.redirect(new URL("/calendar?success=true", req.url));
    } catch (err) {
        console.error("OAuth callback error:", err);
        return NextResponse.redirect(new URL("/calendar?error=server_error", req.url));
    }
}
