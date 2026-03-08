import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Customer profile uses the `profiles` table directly.
export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referral_credits: number | null;
  created_at: string;
  updated_at: string;
}

export const useCustomerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, address, city, zip_code, avatar_url, referral_code, referral_credits, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile((data as CustomerProfile) ?? null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (
    updates: Partial<Omit<CustomerProfile, "id" | "user_id" | "created_at" | "updated_at" | "email" | "referral_code">>,
  ) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      if (profile) {
        // Profile exists, update it
        const { error } = await supabase
          .from("profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Profile missing (e.g. trigger didn't fire), create it
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            full_name: updates.full_name || user.user_metadata?.full_name || "User",
            email: user.email,
            account_type: "customer",
            referral_code: "SAFE" + user.id.substring(0, 6).toUpperCase(),
            ...updates,
          });
        if (error) throw error;
      }
      await fetchProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
};
