import { getGoogleOAuthClient } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET() {
    const oauth2Client = getGoogleOAuthClient();

    if (!oauth2Client) {
        return NextResponse.json(
            { error: "Google OAuth not configured" },
            { status: 500 }
        );
    }

    const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline", // Importante para receber refresh token
        scope: scopes,
        prompt: "consent", // Forçar consentimento para garantir refresh token
    });

    return NextResponse.redirect(url);
}
