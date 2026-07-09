import { Suspense } from "react";
import { connection } from "next/server";
import ClientProducts from "@/components/ClientProducts";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function Home() {
  await connection();
  console.log("[page] Home rendering start", Date.now());
  return (
    <ErrorBoundary>
      <div className="bg-background min-h-full">
        <div className="container mx-auto px-4">
          <div className="space-y-4 py-4">
            <Suspense
              fallback={
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2"></div>
                </div>
              }
            >
              <ClientProducts />
            </Suspense>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
