import { prisma } from "@/src/lib/prisma";

export type NavbarNotification = {
  id: string;
  report_id: string | null;
  subject: string;
  message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  read_at: string | null;
  channel?: string | null;
};

export async function getNavbarNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId, channel: "internal" },
    select: {
      id: true,
      reportId: true,
      subject: true,
      message: true,
      status: true,
      sentAt: true,
      createdAt: true,
      readAt: true,
      channel: true,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return notifications.map((notification) => ({
    id: notification.id,
    report_id: notification.reportId,
    subject: notification.subject,
    message: notification.message,
    status: notification.status,
    sent_at: notification.sentAt?.toISOString() ?? null,
    created_at: notification.createdAt.toISOString(),
    read_at: notification.readAt?.toISOString() ?? null,
    channel: notification.channel,
  })) satisfies NavbarNotification[];
}
