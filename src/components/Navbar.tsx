"use client";
import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "@/components/MobileMenu";

export function Navbar() {
  return (
    <nav className="shrink-0 glass border-b border-white/20 dark:border-white/[0.06]">
      <div className="mx-4 flex h-14 items-center justify-center">
        <div className="absolute start-0">
          <MobileMenu />
        </div>

        <Link href="/" className="flex cursor-pointer items-center">
          <Image src="/logo.svg" alt="" width={288} height={96} className="h-24 w-auto brightness-0 invert" priority />
        </Link>
      </div>
    </nav>
  );
}
