import { supabase } from "@/lib/supabase/client";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+213774029594";

type PendingOrder = {
  title: string;
  quantity: number;
  price: number;
  total: number;
  productId: string;
};

export function getPendingOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem("pendingWhatsAppOrder");
    if (!raw) return null;
    return JSON.parse(raw) as PendingOrder;
  } catch {
    return null;
  }
}

export function setPendingOrder(order: PendingOrder) {
  sessionStorage.setItem("pendingWhatsAppOrder", JSON.stringify(order));
}

export function clearPendingOrder() {
  sessionStorage.removeItem("pendingWhatsAppOrder");
}

export async function processPendingOrder(userId: string): Promise<string | null> {
  const pending = getPendingOrder();
  if (!pending) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, phone, city")
    .eq("profile_id", userId)
    .single();

  const userName = profile?.username || "";
  const userPhone = profile?.phone || "";
  const userCity = profile?.city || "";

  const { data: address } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      street: userName,
      city: userCity,
      state: userPhone,
      zip_code: "00000",
      country: "DZ",
      is_default: true,
    })
    .select()
    .single();

  if (address) {
    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total: pending.total,
        status: "pending",
        payment_method: "cod",
        shipping_address_id: address.id,
      })
      .select()
      .single();

    if (order) {
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: pending.productId,
        quantity: pending.quantity,
        price: pending.price,
      });
    }
  }

  clearPendingOrder();

  const msg = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته، حبيت نأكد الطلب تاعي : ${pending.title} x${pending.quantity} — DA ${pending.total.toFixed(2)}. الاسم: ${userName}. الولاية: ${userCity}. الهاتف: ${userPhone}.`
  );

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}
