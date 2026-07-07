"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("errors.somethingWentWrong")}
          </CardTitle>
          <CardDescription>
            {t("errors.unexpectedError")}
          </CardDescription>
          {error.digest && (
            <p className="text-muted-foreground mt-2 text-xs">
              {t("errors.errorId", { digest: error.digest })}
            </p>
          )}
          <details className="mt-4 text-start">
            <summary className="cursor-pointer text-sm font-medium">
              {t("errors.errorDetails")}
            </summary>
            <pre className="text-muted-foreground bg-muted mt-2 overflow-auto rounded p-2 text-xs">
              {error.message}
            </pre>
          </details>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={reset} className="w-full cursor-pointer">
            <RefreshCw className="ms-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="outline"
            className="w-full cursor-pointer"
          >
            <Home className="ms-2 h-4 w-4" />
            {t("common.goHome")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
