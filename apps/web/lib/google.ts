import { google } from "googleapis";
import { prisma } from "@/lib/db";

export function getGoogleOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

    if (!clientId || !clientSecret) {
        console.warn("Missing Google OAuth credentials");
        // Retorna null ou lança erro dependendo da estratégia, aqui vamos permitir falhar graciosamente
        return null;
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getGoogleCalendarClient(userId: string) {
    const token = await prisma.googleToken.findUnique({
        where: { userId },
    });

    if (!token) {
        throw new Error("User not connected to Google Calendar");
    }

    const oauth2Client = getGoogleOAuthClient();
    if (!oauth2Client) {
        throw new Error("Google OAuth not configured");
    }

    oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken || undefined,
        expiry_date: token.expiryDate ? Number(token.expiryDate) : undefined,
    });

    // Configurar refresh automático do token se necessário
    oauth2Client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            await prisma.googleToken.update({
                where: { userId },
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || undefined, // Se vier novo refresh token
                    expiryDate: tokens.expiry_date,
                },
            });
        }
    });

    return google.calendar({ version: "v3", auth: oauth2Client });
}
