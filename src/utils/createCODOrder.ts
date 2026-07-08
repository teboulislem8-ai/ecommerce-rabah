import { createOrderAction } from "@/app/actions/order";

const PENDING_ORDER_KEY = "pendingWhatsAppOrder";
const BC_CHANNEL = "cod-pending-order";
const AUTH_BC_CHANNEL = "auth-state";

export type PendingOrder = {
  title: string;
  quantity: number;
  price: number;
  total: number;
  productId: string;
};

type Listener = (order: PendingOrder | null) => void;

let bc: BroadcastChannel | null = null;
const listeners = new Set<Listener>();

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!bc) {
    try {
      bc = new BroadcastChannel(BC_CHANNEL);
      bc.onmessage = (event) => {
        const order = event.data as PendingOrder | null;
        listeners.forEach((fn) => fn(order));
      };
    } catch {
      return null;
    }
  }
  return bc;
}

function readFromStorage(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingOrder;
  } catch {
    return null;
  }
}

function writeToStorage(order: PendingOrder | null) {
  if (order) {
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
  } else {
    localStorage.removeItem(PENDING_ORDER_KEY);
  }
}

// Auto-clear pending order when auth state changes across tabs
if (typeof window !== "undefined") {
  try {
    const authChannel = new BroadcastChannel(AUTH_BC_CHANNEL);
    authChannel.onmessage = (event) => {
      if (event.data?.type === "SIGNED_IN" || event.data?.type === "SIGNED_OUT") {
        clearPendingOrder();
      }
    };
  } catch {
    // BroadcastChannel not supported
  }
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getPendingOrder(): PendingOrder | null {
  return readFromStorage();
}

export function setPendingOrder(order: PendingOrder) {
  writeToStorage(order);
  getChannel()?.postMessage(order);
}

export function clearPendingOrder() {
  writeToStorage(null);
  getChannel()?.postMessage(null);
}

export async function processPendingOrder(): Promise<{ whatsappUrl?: string; error?: string } | null> {
  const pending = getPendingOrder();
  if (!pending) return null;

  const result = await createOrderAction({
    productId: pending.productId,
    quantity: pending.quantity,
    price: pending.price,
    total: pending.total,
  });

  if (result.success) {
    clearPendingOrder();
    return { whatsappUrl: result.whatsappUrl };
  }

  return { error: result.error };
}
