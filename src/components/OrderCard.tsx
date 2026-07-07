import { Card, CardContent } from "@/components/ui/card";
import { OrderType } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

interface OrderCardProps {
  order: OrderType;
  onDelete?: (orderId: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "مشحون",
  delivered: "موصل",
  cancelled: "ملغي",
};

export function OrderCard({ order }: OrderCardProps) {
  const products = order.order_items
    ?.map((item) => item.product?.title)
    .filter(Boolean)
    .join("، ") || "—";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-base font-medium">{products}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("fr-DZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-base font-semibold">{formatCurrency(order.total)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
