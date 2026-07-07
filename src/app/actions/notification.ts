"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const markAsReadSchema = z.object({
  notificationId: z.number().int().positive(),
});

const markAllAsReadSchema = z.object({
  userId: z.string().uuid(),
});

export type MarkAsReadResult =
  | { success: true }
  | { success: false; error: string };

export async function markNotificationAsReadAction(input: unknown): Promise<MarkAsReadResult> {
  const parsed = markAsReadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { notificationId } = parsed.data;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "فشل في تحديث الإشعار" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function markAllNotificationsAsReadAction(input: unknown): Promise<MarkAsReadResult> {
  const parsed = markAllAsReadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { userId } = parsed.data;

  if (userId !== user.id) {
    return { success: false, error: "لا يمكن تعديل إشعارات مستخدم آخر" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    return { success: false, error: "فشل في تحديث الإشعارات" };
  }

  revalidatePath("/admin");
  return { success: true };
}
