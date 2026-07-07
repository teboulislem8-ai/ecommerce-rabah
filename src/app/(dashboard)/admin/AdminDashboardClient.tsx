"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Settings,
} from "lucide-react";
import { adminProductService } from "@/services/admin/adminProductService";
import { adminOrderService } from "@/services/admin/adminOrderService";
import { adminUserService } from "@/services/admin/adminUserService";
import { formatCurrency } from "@/utils/formatCurrency";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface DashboardStats {
  products: {
    total: number;
    lowStock: number;
    totalValue: number;
  };
  orders: {
    total: number;
    revenue: number;
    averageValue: number;
    pending: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
    newThisMonth: number;
  };
}

export default function AdminDashboardClient() {
  const t = useTranslations("adminDashboard");
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdmin();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, adminLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [productAnalytics, orderAnalytics, userAnalytics] =
        await Promise.all([
          adminProductService.getProductAnalytics(),
          adminOrderService.getOrderAnalytics(),
          adminUserService.getUserAnalytics(),
        ]);

      setStats({
        products: {
          total: productAnalytics.totalProducts,
          lowStock: productAnalytics.lowStockCount,
          totalValue: productAnalytics.totalInventoryValue,
        },
        orders: {
          total: orderAnalytics.totalOrders,
          revenue: orderAnalytics.totalRevenue,
          averageValue: orderAnalytics.averageOrderValue,
          pending: orderAnalytics.ordersByStatus.pending || 0,
        },
        users: {
          total: userAnalytics.totalUsers,
          active: userAnalytics.activeUsers,
          admins: userAnalytics.totalAdmins,
          newThisMonth: userAnalytics.newUsersThisMonth,
        },
      });
      console.log("[AdminDashboard] stats loaded:", {
        lowStock: productAnalytics.lowStockCount,
        pendingOrders: orderAnalytics.ordersByStatus.pending,
        totalOrders: orderAnalytics.totalOrders,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (adminError || !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t("accessDenied")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {t("accessDeniedDescription")}
            </p>
            <Link href="/dashboard">
              <Button>{t("goToUserDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>{t("unableToLoadData")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminBadge")}</h1>
          <p className="text-muted-foreground">{t("welcome", { email: user?.email || "" })}</p>
        </div>
        <Badge variant="secondary" className="bg-primary/15 text-primary">
          <Settings className="ms-1 h-3 w-3" />
          {t("adminBadge")}
        </Badge>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.orders.revenue)}
            </div>
            <p className="text-muted-foreground text-xs">
              {t("totalOrders", { count: stats.orders.total })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalProducts")}
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products.total}</div>
            <p className="text-muted-foreground text-xs">
              {t("lowStockCount", { count: stats.products.lowStock })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-muted-foreground text-xs">
              {t("activeUsers", { count: stats.users.active })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pendingOrders")}
            </CardTitle>
            <ShoppingCart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.pending}</div>
            <p className="text-muted-foreground text-xs">{t("needAttention")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/admin/products">
              <Button className="w-full cursor-pointer" variant="outline">
                <Package className="ms-2 h-4 w-4" />
                {t("manageProducts")}
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="w-full cursor-pointer" variant="outline">
                <Users className="ms-2 h-4 w-4" />
                {t("manageUsers")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="ms-2 h-5 w-5" />
              {t("keyMetrics")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t("averageOrderValue")}
              </span>
              <span className="font-medium">
                {formatCurrency(stats.orders.averageValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t("inventoryValue")}
              </span>
              <span className="font-medium">
                {formatCurrency(stats.products.totalValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t("newUsersThisMonth")}
              </span>
              <span className="font-medium">{stats.users.newThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{t("adminUsers")}</span>
              <span className="font-medium">{stats.users.admins}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="ms-2 h-5 w-5" />
              {t("alertsAndNotifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.products.lowStock > 0 ? (
              <Link
                href="/admin/products"
                className="flex items-center rounded-lg border border-yellow-200 bg-yellow-50 p-3 transition-colors hover:bg-yellow-100"
              >
                <AlertTriangle className="ms-2 h-4 w-4 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {t("lowStockAlert")}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {t("lowStockAlertDescription", { count: stats.products.lowStock })}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center rounded-lg border border-green-200 bg-green-50 p-3">
                <Activity className="ms-2 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {t("allClear")}
                  </p>
                  <p className="text-xs text-green-600">
                    {t("allClearDescription")}
                  </p>
                </div>
              </div>
            )}

            {stats.orders.pending > 0 ? (
              <Link
                href="/admin/orders"
                className="flex items-center rounded-lg border border-primary/30 bg-primary/10 p-3 transition-colors hover:bg-primary/20"
              >
                <Activity className="text-primary ms-2 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-primary text-sm font-medium">
                    {t("pendingOrdersAlert")}
                  </p>
                  <p className="text-primary text-xs">
                    {t("pendingOrdersDescription", { count: stats.orders.pending })}
                  </p>
                </div>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
