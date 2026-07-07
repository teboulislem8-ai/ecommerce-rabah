"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { toast } from "sonner";
import {
  MessageCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Truck,
  PackageCheck,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";

type OrderRow = {
  id: number;
  user_id: string;
  total: number;
  status: string;
  payment_method: string | null;
  shipping_address_id: number;
  created_at: string;
  updated_at: string;
  addresses: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  processing: RefreshCw,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+213774029594";

export default function AdminOrdersClient() {
  const t = useTranslations("adminOrders");
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, { email: string; username: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("orders")
        .select(`
          *,
          addresses!orders_shipping_address_id_fkey (
            street,
            city,
            state,
            zip_code,
            country
          )
        `)
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = (data || []) as OrderRow[];
      setOrders(rows);

      // Count query for pagination
      let countQuery = supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      if (statusFilter !== "all") {
        countQuery = countQuery.eq("status", statusFilter);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Batch-fetch profiles
      const userIds = [...new Set(rows.map((o) => o.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("profile_id, email, username")
          .in("profile_id", userIds);

        const map: Record<string, { email: string; username: string }> = {};
        (profiles || []).forEach((p) => {
          map[p.profile_id] = { email: p.email || "", username: p.username || "" };
        });
        setProfilesMap(map);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", JSON.stringify(err, null, 2));
      toast.error(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/signin");
      return;
    }
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, adminLoading, router, fetchOrders]);

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      toast.success(t("statusUpdated"));
    } catch (err) {
      console.error("Failed to update status:", JSON.stringify(err, null, 2));
      toast.error(t("failedToUpdateStatus"));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const addr = o.addresses;
    return (
      o.id.toString().includes(term) ||
      addr?.street.toLowerCase().includes(term) ||
      addr?.state.includes(term) ||
      addr?.city.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  if (adminLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="cursor-pointer gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("refresh")}
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`status.${status}`)}
            </button>
          ),
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-border bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-10 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PackageCheck className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground">{t("noOrders")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const addr = order.addresses;
            const profile = profilesMap[order.user_id];
            const StatusIcon = STATUS_ICONS[order.status] || Clock;
            const statusColors = STATUS_COLORS[order.status] || "";
            const nextStatuses = getNextStatuses(order.status);

            return (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: Order info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">#{order.id}</span>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${statusColors}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {t(`status.${order.status}`)}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {new Date(order.created_at).toLocaleDateString("fr-DZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">{t("customer")}: </span>
                          <span>{addr?.street || t("notProvided")}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("phone")}: </span>
                          <span dir="ltr">{addr?.state || t("notProvided")}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("city")}: </span>
                          <span>{addr?.city || t("notProvided")}</span>
                        </div>
                        {profile?.email && (
                          <div>
                            <span className="text-muted-foreground">{t("email")}: </span>
                            <span className="text-xs">{profile.email}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">{t("total")}: </span>
                          <span className="font-semibold">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex shrink-0 flex-wrap items-start gap-2">
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `مرحباً! بخصوص الطلب رقم #${order.id} للزبون ${addr?.street || ""} (${addr?.state || ""}) - ${addr?.city || ""}.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-green-600 px-3 py-2.5 text-xs font-medium text-white hover:bg-green-700 min-h-[44px]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>

                      {/* Status actions */}
                      {nextStatuses.map((ns) => (
                        <Button
                          key={ns.value}
                          size="sm"
                          variant={ns.variant as "default" | "outline" | "destructive"}
                          onClick={() => handleStatusUpdate(order.id, ns.value)}
                          disabled={updatingId === order.id}
                          className="cursor-pointer text-xs min-h-[44px]"
                        >
                          {ns.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
            {t("previous")}
          </Button>
          <span className="text-muted-foreground text-sm">
            {t("pageOf", { current: page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="cursor-pointer"
          >
            {t("next")}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function getNextStatuses(
  current: string,
): { value: string; label: string; variant: string }[] {
  switch (current) {
    case "pending":
      return [
        { value: "processing", label: "قبول الطلب", variant: "default" },
        { value: "cancelled", label: "إلغاء", variant: "destructive" },
      ];
    case "processing":
      return [
        { value: "shipped", label: "شحن", variant: "default" },
        { value: "cancelled", label: "إلغاء", variant: "destructive" },
      ];
    case "shipped":
      return [{ value: "delivered", label: "توصيل", variant: "default" }];
    case "delivered":
    case "cancelled":
      return [];
    default:
      return [];
  }
}
