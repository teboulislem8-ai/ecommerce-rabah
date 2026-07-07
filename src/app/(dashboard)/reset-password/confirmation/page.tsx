import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordConfirmation() {
  const t = useTranslations();
  return (
    <div className="bg-background flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("auth.checkYourEmail")}</CardTitle>
          <CardDescription>
            {t("auth.resetLinkSent")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-100 p-4 text-sm text-green-800">
            <p>
              {t("auth.resetLinkDescription")}
            </p>
            <p className="mt-2">
              {t("auth.linkExpiresIn")}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Link href="/signin" className="w-full">
            <Button className="hover:bg-primary/90 w-full cursor-pointer">
              {t("auth.backToSignIn")}
            </Button>
          </Link>
          <div className="mt-4 text-center text-sm">
            {t("auth.didNotReceiveEmail")}{" "}
            <Link
              href="/reset-password"
              className="text-primary hover:text-primary/90 cursor-pointer underline"
            >
              {t("common.tryAgain")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
