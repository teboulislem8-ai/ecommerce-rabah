"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, LayoutDashboard, Package, Users, ClipboardList } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { href: "/admin", label: "لوحة الإدارة", icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/users", label: "المستخدمين", icon: Users },
];

const pageTitles: Record<string, string> = {
  "/admin": "لوحة الإدارة",
  "/admin/orders": "الطلبات",
  "/admin/products": "المنتجات",
  "/admin/users": "المستخدمين",
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading, error } = useAdmin();
  const { signOut, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">غير مصرح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              ماعندكش صلاحية الوصول لهذه الصفحة.
            </p>
            <Link href="/">
              <Button>العودة للمتجر</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = pageTitles[pathname] || "لوحة الإدارة";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top bar — desktop nav links + mobile minimal */}
      <nav className="sticky top-0 z-50 flex items-center gap-4 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">العودة للمتجر</span>
        </Link>

        {/* Page title — visible on mobile */}
        <span className="text-sm font-medium md:hidden">{pageTitle}</span>

        {/* Desktop nav links */}
        <div className="hidden md:flex md:items-center md:gap-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors min-h-[44px]",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        {user && <NotificationBell userId={user.id} />}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="cursor-pointer gap-1.5 min-h-[44px]"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </Button>
      </nav>

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <AdminBottomNav />
    </div>
  );
}
