"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useUnreadCount, useRealtimeNotifications } from "@/hooks/queries";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/app/actions/notification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const { data: notifications = [] } = useNotifications(userId);
  const { data: unreadCount = 0 } = useUnreadCount(userId);
  useRealtimeNotifications(userId);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction({ userId });
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (notification.link) {
      router.push(notification.link);
    }
    if (!notification.is_read) {
      await markNotificationAsReadAction({ notificationId: notification.id });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex h-9 w-9 items-center justify-center rounded-md cursor-pointer">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">{t("notifications")}</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              {t("markAllRead")}
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex cursor-pointer flex-col items-start gap-1 px-3 py-2.5 ${
                  !notification.is_read ? "bg-muted/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`text-sm ${
                      !notification.is_read ? "font-medium" : ""
                    }`}
                  >
                    {notification.title}
                  </span>
                  {!notification.is_read && (
                    <span className="bg-primary h-2 w-2 rounded-full" />
                  )}
                </div>
                {notification.body && (
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {notification.body}
                  </span>
                )}
                <span className="text-muted-foreground text-[10px]">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
