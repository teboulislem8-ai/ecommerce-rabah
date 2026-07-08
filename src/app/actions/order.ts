"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  price: z.number().positive(),
  total: z.number().positive(),
});

export type CreateOrderResult =
  | { success: true; whatsappUrl: string }
  | { success: false; error: string };

export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول أولاً" };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("username, phone, city")
    .eq("profile_id", user.id)
    .single();

  if (profileErr || !profile) {
    return { success: false, error: "الملف الشخصي لم يكتمل بعد، حاول مرة أخرى" };
  }

  const { productId, quantity, price, total } = parsed.data;

  const { data: address, error: addrErr } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      street: profile?.username || "",
      city: profile?.city || "",
      state: profile?.phone || "",
      zip_code: "00000",
      country: "DZ",
      is_default: true,
    })
    .select()
    .single();

  if (addrErr || !address) {
    return { success: false, error: "فشل في إنشاء العنوان" };
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total,
      status: "pending",
      payment_method: "cod",
      shipping_address_id: address.id,
    })
    .select()
    .single();

  if (orderErr || !order) {
    return { success: false, error: "فشل في إنشاء الطلب" };
  }

  const { error: itemsErr } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: productId,
    quantity,
    price,
  });

  if (itemsErr) {
    return { success: false, error: "فشل في إضافة المنتجات" };
  }

  revalidatePath("/admin/orders");

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+213774029594";
  const userName = profile?.username || "";
  const userCity = profile?.city || "";
  const userPhone = profile?.phone || "";
  const productTitle = productId;
  const msg = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته، حبيت نأكد الطلب تاعي : ${productTitle} x${quantity} — DA ${total.toFixed(2)}. الاسم: ${userName}. الولاية: ${userCity}. الهاتف: ${userPhone}.`
  );

  return {
    success: true,
    whatsappUrl: `https://wa.me/${whatsappNumber}?text=${msg}`,
  };
}
