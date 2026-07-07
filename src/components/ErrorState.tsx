"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home, WifiOff } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ErrorStateProps {
  title?: string;
  description?: string;
  showRetry?: boolean;
  showHomeButton?: boolean;
  onRetry?: () => void;
  error?: Error | null;
  type?: "network" | "not-found" | "permission" | "general";
}

export function ErrorState({
  title,
  description,
  showRetry = true,
  showHomeButton = true,
  onRetry,
  error,
  type = "general",
}: ErrorStateProps) {
  const t = useTranslations("errors");

  const getErrorConfig = () => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff className="text-destructive h-8 w-8" />,
          title: title || t("connectionError"),
          description: description || t("connectionErrorDescription"),
        };
      case "not-found":
        return {
          icon: <AlertCircle className="text-muted-foreground h-8 w-8" />,
          title: title || t("noDataFound"),
          description: description || t("noDataDescription"),
        };
      case "permission":
        return {
          icon: <AlertCircle className="text-destructive h-8 w-8" />,
          title: title || t("accessDenied"),
          description: description || t("accessDeniedDescription"),
        };
      default:
        return {
          icon: <AlertCircle className="text-destructive h-8 w-8" />,
          title: title || t("somethingWentWrong"),
          description: description || t("unexpectedError"),
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="flex min-h-[300px] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            {config.icon}
          </div>
          <CardTitle className="text-xl font-bold">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
          {error && (
            <details className="mt-4 text-start">
              <summary className="cursor-pointer text-sm font-medium">
                {t("errorDetails")}
              </summary>
              <pre className="text-muted-foreground bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                {error.message}
              </pre>
            </details>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="w-full cursor-pointer">
              <RefreshCw className="ms-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          )}
          {showHomeButton && (
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="outline"
              className="w-full cursor-pointer"
            >
              <Home className="ms-2 h-4 w-4" />
              {t("goHome")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
