import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/shared/Navbar";

async function getUnreadCount(userId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const unreadCount = await getUnreadCount(user.id);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} unreadCount={unreadCount} />
      {children}
    </div>
  );
}