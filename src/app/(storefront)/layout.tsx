import { Navbar } from "@/components/Navbar";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileShell>
      <Navbar />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
