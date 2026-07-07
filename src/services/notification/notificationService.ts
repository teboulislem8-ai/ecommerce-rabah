import { supabase } from '@/lib/supabase/client';
import { NotificationType } from '@/types';

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationType[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', JSON.stringify(error, null, 2));
      return [];
    }

    return (data || []) as NotificationType[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', JSON.stringify(error, null, 2));
      return 0;
    }

    return count || 0;
  },

  async markAsRead(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', JSON.stringify(error, null, 2));
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', JSON.stringify(error, null, 2));
    }
  },
};
