"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Phone, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processPendingOrder } from "@/utils/createCODOrder";

const WILAYA_KEYS = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24","25","26","27","28","29","30",
  "31","32","33","34","35","36","37","38","39","40",
  "41","42","43","44","45","46","47","48","49","50",
  "51","52","53","54","55","56","57","58",
];

export function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword || !nameInput || !phoneInput || !cityInput) {
      setError(t("validation.fillAllFields"));
      return;
    }

    if (password.length < 6) {
      setError(t("validation.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("validation.passwordsDoNotMatch"));
      return;
    }

    try {
      setLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        await supabase.from("profiles").upsert({
          profile_id: data.user.id,
          username: nameInput,
          phone: phoneInput,
          city: cityInput,
        });
      }

      if (data?.user) {
        const waUrl = await processPendingOrder(data.user.id);
        if (waUrl) {
          window.location.href = waUrl;
          return;
        }
      }

      toast.success(t("auth.signUpSuccess"));
      router.push(redirectTo || "/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.signUpError");
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
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground absolute top-0 end-0 inline-flex h-full cursor-pointer items-center justify-center px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              </span>
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={loading}
        >
          {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
        </Button>
        <p className="text-muted-foreground text-sm">
          {t("auth.haveAccount")}{" "}
          <Link href="/signin" className="text-primary underline">
            {t("auth.signInLink")}
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}
