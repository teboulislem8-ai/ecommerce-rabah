"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

const updateStatusSchema = z.object({
  orderId: z.number().int().positive(),
  status: z.enum(VALID_STATUSES),
});

const deleteOrderSchema = z.object({
  orderId: z.number().int().positive(),
});

export type OrderStatusResult =
  | { success: true; data?: unknown }
  | { success: false; error: string };

export async function updateOrderStatusAction(input: unknown): Promise<OrderStatusResult> {
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { orderId, status } = parsed.data;

  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "فشل في تحديث حالة الطلب" };
  }

  revalidatePath("/admin/orders");
  return { success: true, data };
}

export async function deleteOrderAction(input: unknown): Promise<OrderStatusResult> {
  const parsed = deleteOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { orderId } = parsed.data;

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    return { success: false, error: "فشل في حذف الطلب" };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}
