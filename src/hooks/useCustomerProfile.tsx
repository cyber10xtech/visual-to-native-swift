import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CustomerProfile {
  id: string;
  user_id: string;
  account_type: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referral_credits: number;
  created_at: string;
  updated_at: string;
}

export const useCustomerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchOrCreateProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Fetch phone from profiles_private
          const { data: privateData } = await supabase
            .from("profiles_private")
            .select("phone_number")
            .eq("profile_id", data.id)
            .maybeSingle();

          setProfile({
            id: data.id,
            user_id: data.user_id,
            account_type: data.account_type,
            full_name: data.full_name,
            email: data.email ?? null,
            phone: privateData?.phone_number ?? null,
            address: data.address ?? null,
            city: data.city ?? null,
            zip_code: data.zip_code ?? null,
            avatar_url: data.avatar_url ?? null,
            referral_code: data.referral_code ?? null,
            referral_credits: data.referral_credits ?? 0,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
        } else {
          // Profile not found — auto-create as fallback
          const referralCode = `SAFE${user.id.slice(0, 6).toUpperCase()}`;
          const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer";

          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              full_name: fullName,
              email: user.email,
              account_type: "customer",
              referral_code: referralCode,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setProfile({
            id: newProfile.id,
            user_id: newProfile.user_id,
            account_type: newProfile.account_type,
            full_name: newProfile.full_name,
            email: newProfile.email ?? null,
            phone: null,
            address: newProfile.address ?? null,
            city: newProfile.city ?? null,
            zip_code: newProfile.zip_code ?? null,
            avatar_url: newProfile.avatar_url ?? null,
            referral_code: newProfile.referral_code ?? null,
            referral_credits: newProfile.referral_credits ?? 0,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at,
          });
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user]);

  const createProfile = async (profileData: Partial<CustomerProfile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const referralCode = `SAFE${user.id.slice(0, 6).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          full_name: profileData.full_name || user.email?.split("@")[0] || "Customer",
          email: profileData.email || user.email,
          account_type: "customer",
          address: profileData.address,
          city: profileData.city,
          zip_code: profileData.zip_code,
          referral_code: referralCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Save phone to profiles_private if provided
      if (profileData.phone) {
        await supabase
          .from("profiles_private")
          .insert({ profile_id: data.id, phone_number: profileData.phone });
      }

      const newProfile: CustomerProfile = {
        id: data.id,
        user_id: data.user_id,
        account_type: data.account_type,
        full_name: data.full_name,
        email: data.email ?? null,
        phone: profileData.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        zip_code: data.zip_code ?? null,
        avatar_url: data.avatar_url ?? null,
        referral_code: data.referral_code ?? null,
        referral_credits: data.referral_credits ?? 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setProfile(newProfile);
      return { error: null, data: newProfile };
    } catch (err) {
      return { error: err as Error, data: null };
    }
  };

  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!user || !profile) return { error: new Error("Not authenticated") };

    try {
      const { phone, ...profileUpdates } = updates;

      // Update main profile fields
      const cleanUpdates: Record<string, unknown> = {};
      if (profileUpdates.full_name !== undefined) cleanUpdates.full_name = profileUpdates.full_name;
      if (profileUpdates.email !== undefined) cleanUpdates.email = profileUpdates.email;
      if (profileUpdates.address !== undefined) cleanUpdates.address = profileUpdates.address;
      if (profileUpdates.city !== undefined) cleanUpdates.city = profileUpdates.city;
      if (profileUpdates.zip_code !== undefined) cleanUpdates.zip_code = profileUpdates.zip_code;
      if (profileUpdates.avatar_url !== undefined) cleanUpdates.avatar_url = profileUpdates.avatar_url;

      if (Object.keys(cleanUpdates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(cleanUpdates)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      // Update phone in profiles_private
      if (phone !== undefined) {
        const { data: existing } = await supabase
          .from("profiles_private")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("profiles_private")
            .update({ phone_number: phone })
            .eq("profile_id", profile.id);
        } else {
          await supabase
            .from("profiles_private")
            .insert({ profile_id: profile.id, phone_number: phone });
        }
      }

      // Refetch profile
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: privateData } = await supabase
        .from("profiles_private")
        .select("phone_number")
        .eq("profile_id", data.id)
        .maybeSingle();

      setProfile({
        id: data.id,
        user_id: data.user_id,
        account_type: data.account_type,
        full_name: data.full_name,
        email: data.email ?? null,
        phone: privateData?.phone_number ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        zip_code: data.zip_code ?? null,
        avatar_url: data.avatar_url ?? null,
        referral_code: data.referral_code ?? null,
        referral_credits: data.referral_credits ?? 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { profile, loading, error, createProfile, updateProfile };
};
