import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let preferences = await prisma.notificationPreferences.findUnique({
            where: { userId: user.id },
        });

        if (!preferences) {
            preferences = await prisma.notificationPreferences.create({
                data: { userId: user.id },
            });
        }

        return NextResponse.json({ preferences });
    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const { user } = await getSession();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        // Remover campos que não devem ser atualizados diretamente
        delete data.id;
        delete data.userId;
        delete data.createdAt;
        delete data.updatedAt;

        const preferences = await prisma.notificationPreferences.upsert({
            where: { userId: user.id },
            update: data,
            create: {
                userId: user.id,
                ...data,
            },
        });

        return NextResponse.json({ preferences });
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
