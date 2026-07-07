"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, Menu, Moon, Sun, LayoutGrid, ClipboardList, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useCategories } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const t = useTranslations();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: categories } = useCategories();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    signOut();
    setOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        }
      />
      <DialogContent className="max-w-56 p-0" showCloseButton={false}>
        <div className="border-border/50 border-b px-3 py-3">
          <div className="flex items-center justify-center">
            <Image src="/logo.svg" alt="" width={192} height={64} className="h-16 w-auto brightness-0 invert" style={{ width: "auto", height: "auto" }} priority />
            <DialogTitle className="sr-only">
              {t("nav.brand")}
            </DialogTitle>
          </div>
        </div>

        <div className="space-y-1 px-3 pb-3 pt-1">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="text-foreground hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>
                {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
              </span>
            </button>
          )}

          <hr className="border-border/50 my-1" />

          {/* Sections */}
          <div>
            <button
              type="button"
              onClick={() => setSectionsOpen(!sectionsOpen)}
              className="text-foreground hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="flex-1 text-left">{t("nav.categories")}</span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground h-3.5 w-3.5 transition-transform",
                  sectionsOpen && "rotate-180",
                )}
              />
            </button>
            {sectionsOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {categories?.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/?cat=${cat.name.toLowerCase()}`}
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Profile & Orders */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="text-foreground hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            <span>{t("nav.profileAndOrders")}</span>
          </Link>

          {user && (
            <hr className="border-border/50 my-1" />
          )}

          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.signOut")}</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
