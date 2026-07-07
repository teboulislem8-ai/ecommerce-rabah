import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  const t = useTranslations();
  return (
    <div className="bg-background flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("errors.pageNotFound")}</CardTitle>
          <CardDescription>
            {t("errors.pageNotFoundDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              className="cursor-pointer"
            >
              <Home className="ms-2 h-4 w-4" />
              {t("common.goHome")}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("errors.searchSuggestion")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
