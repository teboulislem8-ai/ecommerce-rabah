"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(100),
  price: z.coerce.number().positive(),
  total: z.coerce.number().positive(),
  title: z.string().min(1),
});

export type CreateOrderResult =
  | { success: true; whatsappUrl: string }
  | { success: false; error: string; details: string };

export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    console.error("[createOrderAction] zod validation failed:", parsed.error);
    return { success: false, error: "بيانات غير صالحة", details: parsed.error.message };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[createOrderAction] no authenticated user");
    return { success: false, error: "يجب تسجيل الدخول أولاً", details: "no-session" };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("username, phone, city")
    .eq("profile_id", user.id)
    .single();

  if (profileErr || !profile) {
    console.error("[createOrderAction] profile query failed:", profileErr, { userId: user.id });
    return { success: false, error: "الملف الشخصي لم يكتمل بعد، حاول مرة أخرى", details: profileErr?.message || "profile not found" };
  }

  const { productId, quantity, price, total, title } = parsed.data;
  console.log("[createOrderAction] creating order", { productId, quantity, price, total, userId: user.id, profile });

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
    console.error("[createOrderAction] address insert failed:", addrErr);
    return { success: false, error: "فشل في إنشاء العنوان", details: addrErr?.message || "unknown" };
  }
  console.log("[createOrderAction] address created:", address.id);

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
    console.error("[createOrderAction] order insert failed:", orderErr);
    return { success: false, error: "فشل في إنشاء الطلب", details: orderErr?.message || "unknown" };
  }
  console.log("[createOrderAction] order created:", order.id);

  const { error: itemsErr } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: productId,
    quantity,
    price,
  });

  if (itemsErr) {
    console.error("[createOrderAction] order_items insert failed:", itemsErr);
    return { success: false, error: "فشل في إضافة المنتجات", details: itemsErr.message };
  }
  console.log("[createOrderAction] order_items created");

  revalidatePath("/admin/orders");

  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+213774029594";
  const whatsappNumber = rawNumber.replace(/^\+/, "");
  const userName = profile?.username || "";
  const userCity = profile?.city || "";
  const userPhone = profile?.phone || "";
  const productTitle = title;
  const msg = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته، حبيت نأكد الطلب تاعي : ${productTitle} x${quantity} — DA ${total.toFixed(2)}. الاسم: ${userName}. الولاية: ${userCity}. الهاتف: ${userPhone}.`
  );

  return {
    success: true,
    whatsappUrl: `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${msg}`,
  };
}
