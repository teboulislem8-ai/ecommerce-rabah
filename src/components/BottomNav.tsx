"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 z-40 glass border-t border-white/20 dark:border-white/[0.06]"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) / 2)",
      }}
    >
      <div className="relative mx-auto flex max-w-lg items-center justify-center px-2 py-1.5">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            "flex min-w-[44px] min-h-[44px] select-none flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] transition-colors",
            pathname === "/"
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Home className="h-5 w-5" strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span className="leading-none">{t("home")}</span>
        </Link>
      </div>
    </nav>
  );
}
