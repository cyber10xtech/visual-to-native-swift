import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProfilePrivate {
  id: string;
  profile_id: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  account_type: "professional" | "handyman";
  full_name: string;
  profession: string | null;
  bio: string | null;
  location: string | null;
  daily_rate: string | null;
  contract_rate: string | null;
  skills: string[];
  avatar_url: string | null;
  documents_uploaded: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithContact extends Profile {
  phone_number: string | null;
  whatsapp_number: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileWithContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setProfileExists(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Fetch private contact data (owner-only via RLS)
          const { data: privateData } = await supabase
            .from("profiles_private")
            .select("phone_number, whatsapp_number")
            .eq("profile_id", data.id)
            .maybeSingle();

          const merged: ProfileWithContact = {
            ...(data as Profile),
            phone_number: privateData?.phone_number ?? null,
            whatsapp_number: privateData?.whatsapp_number ?? null,
          };
          setProfile(merged);
          setProfileExists(true);
        } else {
          setProfile(null);
          setProfileExists(false);
        }
      } catch (err) {
        setError(err as Error);
        setProfileExists(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Omit<Profile, "id" | "user_id" | "account_type" | "created_at" | "updated_at">> & {
    phone_number?: string | null;
    whatsapp_number?: string | null;
  }) => {
    if (!user || !profile) return { error: new Error("Not authenticated") };

    try {
      // Separate contact fields from profile fields
      const { phone_number, whatsapp_number, ...profileUpdates } = updates;

      // Update main profile if there are profile fields to update
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      // Update private contact data if contact fields provided
      if (phone_number !== undefined || whatsapp_number !== undefined) {
        const contactUpdate: Record<string, string | null> = {};
        if (phone_number !== undefined) contactUpdate.phone_number = phone_number;
        if (whatsapp_number !== undefined) contactUpdate.whatsapp_number = whatsapp_number;

        // Upsert: update if exists, insert if not
        const { data: existing } = await supabase
          .from("profiles_private")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("profiles_private")
            .update(contactUpdate)
            .eq("profile_id", profile.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("profiles_private")
            .insert({ profile_id: profile.id, ...contactUpdate });
          if (error) throw error;
        }
      }

      // Refetch full profile
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: privateData } = await supabase
        .from("profiles_private")
        .select("phone_number, whatsapp_number")
        .eq("profile_id", data.id)
        .maybeSingle();

      setProfile({
        ...(data as Profile),
        phone_number: privateData?.phone_number ?? null,
        whatsapp_number: privateData?.whatsapp_number ?? null,
      });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { profile, loading, error, updateProfile, profileExists };
};
