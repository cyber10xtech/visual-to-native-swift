import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  user_id: string | null;
  account_type: string | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Read professionals from profiles_public view
        const { data, error } = await supabase
          .from("profiles_public")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const d = data as any;
          setProfile({
            id: d.id,
            user_id: d.user_id ?? null,
            account_type: d.account_type ?? null,
            full_name: d.full_name,
            profession: d.profession ?? null,
            bio: d.bio ?? null,
            location: d.location ?? null,
            daily_rate: d.daily_rate ?? null,
            contract_rate: d.contract_rate ?? null,
            skills: d.skills ?? [],
            avatar_url: d.avatar_url ?? null,
            documents_uploaded: d.documents_uploaded ?? false,
            is_verified: d.is_verified ?? false,
            created_at: d.created_at,
            updated_at: d.updated_at ?? d.created_at,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  return { profile, loading, error };
};
