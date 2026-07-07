"use client";

import { useState, useRef, useEffect } from "react";
import { Home, LayoutGrid, Circle, Diamond, Gem, Heart, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCategories } from "@/hooks/queries";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, typeof Home> = {
  All: Home,
  Rings: Circle,
  Necklaces: Diamond,
  Earrings: Gem,
  Bracelets: Heart,
};

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { data: categories } = useCategories();
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setSectionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const categoryItems = [
    { name: t("allCategories"), icon: Home, href: "/" },
    ...(categories || []).map((cat) => {
      const Icon = categoryIcons[cat.name] || LayoutGrid;
      return {
        name: cat.name,
        icon: Icon,
        href: `/?cat=${cat.name.toLowerCase()}`,
      };
    }),
  ];

  const handleSectionNav = (href: string) => {
    setSectionsOpen(false);
    router.push(href);
  };

  return (
    <nav
      className="shrink-0 z-40 glass border-t border-white/20 dark:border-white/[0.06]"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) / 2)",
      }}
    >
      <div className="relative mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
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

        {/* Sections */}
        <button
          ref={btnRef}
          type="button"
          onClick={() => setSectionsOpen(!sectionsOpen)}
          className={cn(
            "flex min-w-[44px] min-h-[44px] select-none flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] transition-colors cursor-pointer",
            sectionsOpen
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={sectionsOpen ? 2.5 : 2} />
          <span className="leading-none">{t("categories")}</span>
        </button>

        {/* My Orders */}
        <Link
          href="/profile"
          className={cn(
            "flex min-w-[44px] min-h-[44px] select-none flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] transition-colors",
            pathname === "/profile"
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ClipboardList className="h-5 w-5" strokeWidth={pathname === "/profile" ? 2.5 : 2} />
          <span className="leading-none">{t("orders")}</span>
        </Link>

        {/* Sections popup */}
        {sectionsOpen && (
          <div
            ref={popupRef}
            className="bg-popover text-popover-foreground absolute bottom-full mb-2 left-1/2 z-50 w-48 -translate-x-1/2 rounded-xl border shadow-lg"
          >
            <div className="space-y-0.5 p-1.5">
              {categoryItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSectionNav(item.href)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </nav>
  );
}
