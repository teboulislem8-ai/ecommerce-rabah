"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileCard } from "@/components/ProfileCard";
import { OrderCard } from "@/components/OrderCard";
import { EmptyOrdersState } from "@/components/EmptyOrdersState";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { OrderType, ProfileType } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  subscribeToUserOrders,
  unsubscribeFromUserOrders,
  type OrderSubscriptionCallbacks,
} from "@/services/order/orderSubscriptionService";
import {
  subscribeToUserProfile,
  unsubscribeFromUserProfile,
  type ProfileSubscriptionCallbacks,
} from "@/services/profile/profileSubscriptionService";

interface ProfileClientPageProps {
  initialProfile: ProfileType | null;
  initialOrders: OrderType[];
  user: User;
}

export default function ProfileClientPage({
  initialProfile,
  initialOrders,
  user,
}: ProfileClientPageProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState(initialProfile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
  const [email, setEmail] = useState(initialProfile?.email || user.email || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [city, setCity] = useState(initialProfile?.city || "");
  const [orders, setOrders] = useState<OrderType[]>(initialOrders);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (
    usernameInput: string,
    emailInput: string,
    avatarUrlInput: string,
    phoneInput?: string,
    cityInput?: string,
  ) => {
    try {
      setIsSaving(true);

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({
          username: usernameInput,
          email: emailInput,
          avatar_url: avatarUrlInput,
          phone: phoneInput ?? phone,
          city: cityInput ?? city,
        })
        .eq("profile_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setUsername(updatedProfile.username || "");
      setEmail(updatedProfile.email || "");
      setAvatarUrl(updatedProfile.avatar_url || "");
      setPhone(updatedProfile.phone || "");
      setCity(updatedProfile.city || "");

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", JSON.stringify(error, null, 2));
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success(
        "Verification email sent! Please check your inbox and click the verification link.",
      );
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update email",
      );
      throw error;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleOrderDeleted = (deletedOrderId: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== deletedOrderId));
  };

  useEffect(() => {
    let orderSubscription: RealtimeChannel | null = null;
    let profileSubscription: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      try {
        const orderCallbacks: OrderSubscriptionCallbacks = {
          onOrderUpdate: (order: OrderType) => {
            setOrders((prevOrders) => {
              const index = prevOrders.findIndex((o) => o.id === order.id);
              if (index !== -1) {
                const updated = [...prevOrders];
                updated[index] = { ...updated[index], ...order };
                return updated;
              }
              return prevOrders;
            });
          },
          onOrderDelete: (order: OrderType) => {
            setOrders((prevOrders) =>
              prevOrders.filter((o) => o.id !== order.id),
            );
          },
        };

        const profileCallbacks: ProfileSubscriptionCallbacks = {
          onProfileUpdate: (profile: ProfileType) => {
            setUsername(profile.username || "");
            setEmail(profile.email || "");
            setAvatarUrl(profile.avatar_url || "");
            setPhone(profile.phone || "");
            setCity(profile.city || "");
          },
        };

        orderSubscription = subscribeToUserOrders(user.id, orderCallbacks);
        profileSubscription = subscribeToUserProfile(user.id, profileCallbacks);
      } catch (error) {
        console.error("Error setting up subscriptions:", error);
      }
    };

    setupSubscriptions();

    return () => {
      try {
        unsubscribeFromUserOrders(orderSubscription);
        unsubscribeFromUserProfile(profileSubscription);
      } catch (error) {
        console.error("Error cleaning up subscriptions:", error);
      }
    };
  }, [user.id]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-6 md:grid md:grid-cols-3">
        <div className="md:col-span-1">
          <ProfileCard
            user={user}
            username={username}
            setUsername={setUsername}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            city={city}
            setCity={setCity}
            createdAt={initialProfile?.created_at || null}
            isSaving={isSaving}
            onSaveProfile={handleSaveProfile}
            onSignOut={handleSignOut}
            onUpdateEmail={handleUpdateEmail}
          />
        </div>

        <div className="md:col-span-2">
          {orders.length === 0 ? (
            <EmptyOrdersState onBrowseProducts={() => router.push("/")} />
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onDelete={handleOrderDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
