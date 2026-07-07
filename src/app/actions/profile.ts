"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().max(500).optional(),
  phone: z.string().min(1).max(20).optional(),
  city: z.string().min(1).max(100).optional(),
});

const deleteProfileSchema = z.object({});

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string; issues?: unknown };

export async function updateProfileAction(input: unknown): Promise<UpdateProfileResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "بيانات غير صالحة",
      issues: parsed.error.issues,
    };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("profile_id", user.id);

  if (error) {
    return { success: false, error: "فشل في تحديث الملف" };
  }

  revalidatePath("/profile");
  return { success: true };
}

export type DeleteProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteProfileAction(input: unknown): Promise<DeleteProfileResult> {
  const parsed = deleteProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "بيانات غير صالحة" };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Delete avatar from storage before removing the profile row
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("profile_id", user.id)
    .single();

  if (profile?.avatar_url) {
    const avatarPath = profile.avatar_url.split("/avatars/")[1];
    if (avatarPath) {
      await supabase.storage.from("avatars").remove([avatarPath]);
    }
  }

  const { error } = await supabase.rpc("delete_user_account", {
    p_user_id: user.id,
  });

  if (error) {
    return { success: false, error: "فشل في حذف الحساب" };
  }

  // Delete the auth user account (requires service role key)
  const adminSupabase = createAdminSupabase();
  const { error: adminError } = await adminSupabase.auth.admin.deleteUser(
    user.id,
  );

  if (adminError) {
    console.error(
      "Failed to delete auth user:",
      JSON.stringify(adminError, null, 2),
    );
    return { success: false, error: "فشل في حذف الحساب" };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}
