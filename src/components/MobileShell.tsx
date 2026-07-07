"use client";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#F2F2F2] via-[#EBE0E0] to-[#F2F2F2] dark:from-[#0D0D0D] dark:via-[#1A1212] dark:to-[#0D0D0D]">
      {children}
    </div>
  );
}
