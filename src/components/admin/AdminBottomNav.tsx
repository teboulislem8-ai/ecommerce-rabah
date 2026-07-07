"use client";

import { LayoutDashboard, ClipboardList, Package, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/admin", label: "لوحة الإدارة", icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات", icon: ClipboardList },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/users", label: "المستخدمين", icon: Users },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 start-0 end-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) / 2)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-[64px] min-h-[48px] select-none flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[11px] transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="leading-none">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
