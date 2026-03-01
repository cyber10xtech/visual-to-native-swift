import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Matches the customer_profiles table in the unified schema.
// Note: columns from the old profiles table that don't exist here:
//   account_type, location, interests — removed.
export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
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
      // Customer data lives in customer_profiles, NOT profiles
      const { data, error } = await supabase.from("customer_profiles").select("*").eq("user_id", user.id).maybeSingle();

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
    if (!user || !profile) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("customer_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
};
