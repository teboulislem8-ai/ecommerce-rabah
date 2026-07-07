"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export function UpdatePasswordForm({ message }: { message: string | null }) {
  const t = useTranslations();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if we have the hash fragment from the URL (Supabase authentication flow)
  useEffect(() => {
    // When the component mounts, check if we're in the hash fragment flow
    const checkHashParams = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");

        if (accessToken && type === "recovery") {
          // We have a valid recovery flow from email link
          console.log("Valid recovery flow detected");

          // Set the access token in Supabase to authenticate the user
          // This is important - without this, updateUser won't work
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });
        }
      }
    };

    // Check hash params immediately and also listen for hash changes
    checkHashParams();
    window.addEventListener("hashchange", checkHashParams);

    return () => {
      window.removeEventListener("hashchange", checkHashParams);
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Password is required");
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

      // According to the Supabase docs, we use updateUser to set the new password
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      if (data) {
        toast.success(t("auth.passwordUpdated"));

        // Redirect to sign in page after successful password update
        setTimeout(() => {
          router.push(
            "/signin?message=Your password has been updated successfully. Please sign in with your new password.",
          );
        }, 2000);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while updating your password";
      setError(errorMessage);
      console.error("Password update error:", error);
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
          <div className="bg-primary/15 rounded-md p-3 text-sm text-green-500">
            {message}
          </div>
        )}
        <div className="mb-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          Enter your new password below. You must have clicked the password
          reset link from your email to complete this process.
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.newPassword")}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
            />
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground absolute top-0 end-0 inline-flex h-full cursor-pointer items-center justify-center px-3"
              onClick={togglePasswordVisibility}
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
          <Label htmlFor="confirmPassword">{t("auth.confirmNewPassword")}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
            />
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground absolute top-0 end-0 inline-flex h-full cursor-pointer items-center justify-center px-3"
              onClick={toggleConfirmPasswordVisibility}
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
      <CardFooter className="flex flex-col">
        <Button
          type="submit"
          className="hover:bg-primary/90 w-full cursor-pointer"
          disabled={loading}
        >
          {loading ? "Updating..." : t("auth.updatePassword")}
        </Button>
        <div className="mt-4 text-center text-sm">
          <Link
            href="/signin"
            className="text-primary hover:text-primary/90 cursor-pointer underline"
          >
            {t("auth.goToSignIn")}
          </Link>
        </div>
      </CardFooter>
    </form>
  );
}
