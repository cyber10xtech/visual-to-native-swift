import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CustomerProfile {
  id: string;
  user_id: string;
  account_type: string | null;
  full_name: string;
  email: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referral_credits: number | null;
  location: string | null;
  interests: string[] | null;
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
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as CustomerProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Omit<CustomerProfile, "id" | "user_id" | "created_at" | "updated_at" | "email">>) => {
    if (!user || !profile) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      // Refetch to get fresh data
      await fetchProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { profile, loading, error, updateProfile };
};
