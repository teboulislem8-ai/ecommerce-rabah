import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '@/services/notification/notificationService';
import { NotificationType } from '@/types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
};

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.list(userId || ''),
    queryFn: () => notificationService.getNotifications(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.unread(userId || ''),
    queryFn: () => notificationService.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 60 * 1000,
  });
}

export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationType;
          queryClient.setQueryData<NotificationType[]>(
            notificationKeys.list(userId),
            (old) => (old ? [newNotification, ...old] : [newNotification]),
          );
          queryClient.invalidateQueries({ queryKey: notificationKeys.unread(userId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
          queryClient.invalidateQueries({ queryKey: notificationKeys.unread(userId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
