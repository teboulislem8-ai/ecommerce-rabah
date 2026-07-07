"use client";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { EmailChangeModal } from "@/components/EmailChangeModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { profileService } from "@/services/profile/profileService";
import { Pencil, LogOut, Trash2, Phone, MapPin } from "lucide-react";

const WILAYA_KEYS = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24","25","26","27","28","29","30",
  "31","32","33","34","35","36","37","38","39","40",
  "41","42","43","44","45","46","47","48","49","50",
  "51","52","53","54","55","56","57","58",
];

interface ProfileCardProps {
  user: User;
  username: string;
  setUsername: (value: string) => void;
  avatarUrl: string;
  setAvatarUrl: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  createdAt: string | null;
  isSaving: boolean;
  onSaveProfile: (username: string, avatarUrl: string, phone?: string, city?: string) => void;
  onSignOut: () => void;
  onDeleteAccount?: () => void;
  onUpdateEmail?: (newEmail: string) => Promise<void>;
}

export function ProfileCard({
  user,
  username,
  setUsername,
  avatarUrl,
  setAvatarUrl,
  email,
  setEmail,
  phone,
  setPhone,
  city,
  setCity,
  createdAt,
  isSaving,
  onSaveProfile,
  onSignOut,
  onDeleteAccount,
  onUpdateEmail,
}: ProfileCardProps) {
  const t = useTranslations();
  const [usernameInput, setUsernameInput] = useState(username);
  const [avatarUrlInput, setAvatarUrlInput] = useState(avatarUrl);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [cityInput, setCityInput] = useState(city);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsernameInput(username);
    setAvatarUrlInput(avatarUrl);
    setPhoneInput(phone);
    setCityInput(city);
    if (avatarUrl !== avatarUrlInput) {
      setPreviewUrl(null);
    }
  }, [username, avatarUrl, avatarUrlInput, phone, city]);

  const handleSave = () => {
    setUsername(usernameInput);
    setAvatarUrl(avatarUrlInput);
    setPhone(phoneInput);
    setCity(cityInput);
    onSaveProfile(usernameInput, avatarUrlInput, phoneInput, cityInput);
    setEditingName(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size exceeds 2MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    handleAvatarUpload(file);
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      const publicUrl = await profileService.uploadAvatar(user.id, file, avatarUrl);

      if (publicUrl) {
        setAvatarUrlInput(publicUrl);
        setAvatarUrl(publicUrl);
        onSaveProfile(usernameInput, publicUrl, phoneInput, cityInput);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        toast.success("Avatar uploaded successfully");
      } else {
        throw new Error("Failed to upload avatar. Please try again later.");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to upload avatar. Please try again later.");
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const getInitials = () => {
    if (username) return username.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  const displayImageUrl = previewUrl || avatarUrlInput || undefined;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-5">
          {/* PFP */}
          <div
            className="group relative cursor-pointer"
            onClick={handleAvatarClick}
          >
            <Avatar className="h-28 w-28">
              <AvatarImage src={displayImageUrl} className="h-28 w-28 rounded-full object-cover" />
              <AvatarFallback className="h-28 w-28 text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-full bg-black opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs text-white">{uploading ? "..." : t("profile.uploadAvatar")}</span>
            </div>
          </div>

          {/* Name */}
          <div className="w-full space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">{t("profile.username")}</span>
            <div className="flex items-center gap-2">
              {editingName ? (
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                />
              ) : (
                <span className="text-base font-medium">{username || "—"}</span>
              )}
              <button
                type="button"
                onClick={() => setEditingName(!editingName)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="w-full space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">{t("profile.email")}</span>
            <div className="flex items-center gap-2">
              <span className="truncate text-base">{email}</span>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="text-primary hover:text-primary/80 cursor-pointer text-xs font-medium"
              >
                {t("auth.changeEmail")}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="w-full space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">{t("checkout.phoneNumber")}</span>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="0550 00 00 00"
                className="border-border bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border ps-10 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
          </div>

          {/* City */}
          <div className="w-full space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">{t("checkout.deliveryCity")}</span>
            <div className="relative">
              <MapPin className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2" />
              <select
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
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

          {/* Member since */}
          {createdAt && (
            <div className="w-full space-y-1.5">
              <span className="text-muted-foreground text-xs font-medium">{t("profile.memberSince")}</span>
              <p className="text-base">
                {new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Profile ID */}
          <div className="w-full space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">Profile ID</span>
            <p className="text-muted-foreground truncate text-sm font-mono">{user.id}</p>
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 cursor-pointer"
            >
              {isSaving ? "..." : t("profile.saveChanges")}
            </Button>
            <Button
              onClick={onSignOut}
              variant="outline"
              className="cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {onDeleteAccount && (
            <div className="w-full pt-2">
              <Button
                onClick={onDeleteAccount}
                variant="destructive"
                className="w-full cursor-pointer gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t("profile.deleteAccount")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {onUpdateEmail && (
        <EmailChangeModal
          user={user}
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          setEmail={setEmail}
        />
      )}
    </Card>
  );
}
