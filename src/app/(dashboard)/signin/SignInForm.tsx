"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Phone, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { processPendingOrder } from "@/utils/createCODOrder";
import { updateProfileAction } from "@/app/actions/profile";

const WILAYA_KEYS = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24","25","26","27","28","29","30",
  "31","32","33","34","35","36","37","38","39","40",
  "41","42","43","44","45","46","47","48","49","50",
  "51","52","53","54","55","56","57","58",
];

export function SignInForm({
  message,
  redirectTo,
}: {
  message: string | null;
  redirectTo?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !nameInput || !phoneInput || !cityInput) {
      setError(t("validation.fillAllFields"));
      return;
    }

    try {
      setLoading(true);

      await signIn(email, password);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateProfileAction({
          username: nameInput,
          phone: phoneInput,
          city: cityInput,
        });

        const waUrl = await processPendingOrder();
        if (waUrl) {
          window.location.href = waUrl;
          return;
        }
      }

      router.push(redirectTo || "/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.signInError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-primary/15 text-primary rounded-md p-3 text-sm">
            {message}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">{t("profile.username")}</Label>
          <Input
            id="name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t("profile.username")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("checkout.phoneNumber")}</Label>
          <div className="relative">
            <Phone className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="phone"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="0550 00 00 00"
              required
              className="ps-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t("checkout.deliveryCity")}</Label>
          <div className="relative">
            <MapPin className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />
            <select
              id="city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              required
              className="border-border bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border ps-10 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="">{t("checkout.selectCity")}</option>
              {WILAYA_KEYS.map((key) => (
                <option key={key} value={t(`checkout.wilaya.${key}`)}>
                  {t(`checkout.wilaya.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link
              href="/reset-password"
              className="text-primary text-sm underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground absolute top-0 end-0 inline-flex h-full cursor-pointer items-center justify-center px-3"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              </span>
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button
          type="submit"
          className="hover:bg-primary/90 w-full cursor-pointer"
          disabled={loading}
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
        <p className="text-muted-foreground text-sm">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="text-primary underline">
            {t("auth.signUpLink")}
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}
