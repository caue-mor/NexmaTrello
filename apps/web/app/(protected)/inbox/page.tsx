import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotificationCard } from "@/components/inbox/NotificationCard";

async function getNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export default async function InboxPage() {
  const user = await requireAuth();
  const notifications = await getNotifications(user.id);

  const unread = notifications.filter((n) => !n.readAt);

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-neutral-600 mt-1">
            {unread.length} não lidas
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}