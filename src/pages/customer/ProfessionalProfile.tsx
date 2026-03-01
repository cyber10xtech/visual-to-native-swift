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

// Profile shape for professionals/handymen as seen by a customer.
// `profession` is the human-readable label resolved via profiles_compat_view.
export interface Profile {
  id: string;
  user_id: string | null;
  account_type: "professional" | "handyman";
  full_name: string;
  profession: string | null; // merged specialty text from compat view
  bio: string | null;
  location: string | null;
  daily_rate: string | null;
  contract_rate: string | null;
  skills: string[];
  avatar_url: string | null;
  documents_uploaded: boolean;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithContact extends Profile {
  phone_number: string | null;
  whatsapp_number: string | null;
}

// Used when a customer wants to view a professional's full public profile
// (including contact info they're entitled to after a booking).
export const useProfile = (profileId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileWithContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    const targetId = profileId ?? user?.id;
    if (!targetId) {
      setProfile(null);
      setLoading(false);
      setProfileExists(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);

        // profiles_compat_view exposes `profession` as a merged text column
        // (coalesce of profession_specialty + handyman_specialty).
        const column = profileId ? "id" : "user_id";
        const { data, error } = await supabase
          .from("profiles_compat_view")
          .select(
            "id, user_id, account_type, full_name, profession, bio, location, " +
              "daily_rate, contract_rate, skills, avatar_url, " +
              "documents_uploaded, is_verified, created_at, updated_at",
          )
          .eq(column, targetId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Fetch private contact info (only visible if RLS allows it)
          const { data: privateData } = await supabase
            .from("profiles_private")
            .select("phone_number, whatsapp_number")
            .eq("profile_id", data.id)
            .maybeSingle();

          const merged: ProfileWithContact = {
            id: data.id,
            user_id: data.user_id,
            account_type: data.account_type as "professional" | "handyman",
            full_name: data.full_name,
            profession: (data as any).profession ?? null,
            bio: (data as any).bio ?? null,
            location: (data as any).location ?? null,
            daily_rate: (data as any).daily_rate ?? null,
            contract_rate: (data as any).contract_rate ?? null,
            skills: (data as any).skills ?? [],
            avatar_url: (data as any).avatar_url ?? null,
            documents_uploaded: (data as any).documents_uploaded ?? false,
            is_verified: (data as any).is_verified ?? null,
            created_at: data.created_at,
            updated_at: data.updated_at,
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
  }, [user, profileId]);

  return { profile, loading, error, profileExists };
};
