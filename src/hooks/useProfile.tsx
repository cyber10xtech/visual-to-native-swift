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
  user_id: string | null;
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
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithContact extends Profile {
  phone_number: string | null;
  whatsapp_number: string | null;
}

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

        const column = profileId ? "id" : "user_id";
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, user_id, account_type, full_name, profession, bio, location, " +
              "daily_rate, contract_rate, skills, avatar_url, " +
              "documents_uploaded, is_verified, created_at, updated_at",
          )
          .eq(column, targetId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const { data: privateData } = await supabase
            .from("profiles_private")
            .select("phone_number, whatsapp_number")
            .eq("profile_id", (data as any).id)
            .maybeSingle();

          const d = data as any;
          const merged: ProfileWithContact = {
            id: d.id,
            user_id: d.user_id,
            account_type: d.account_type as "professional" | "handyman",
            full_name: d.full_name,
            profession: d.profession ?? null,
            bio: d.bio ?? null,
            location: d.location ?? null,
            daily_rate: d.daily_rate ?? null,
            contract_rate: d.contract_rate ?? null,
            skills: d.skills ?? [],
            avatar_url: d.avatar_url ?? null,
            documents_uploaded: d.documents_uploaded ?? false,
            is_verified: d.is_verified ?? null,
            created_at: d.created_at,
            updated_at: d.updated_at,
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
