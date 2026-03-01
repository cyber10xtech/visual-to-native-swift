import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "./useProfile";

const escapeIlikePattern = (str: string): string => str.replace(/[%_\\]/g, "\\$&");

const sanitizeSearchInput = (input: string, maxLength = 100): string =>
  escapeIlikePattern(input.trim().slice(0, maxLength));

// profiles_compat_view exposes `profession` as a single merged text column
// (coalesce of profession_specialty + handyman_specialty enum values).
const COMPAT_VIEW_FIELDS = ("id,user_id,account_type,full_name,profession,bio,location," +
  "daily_rate,contract_rate,skills,avatar_url,documents_uploaded," +
  "is_verified,created_at,updated_at") as const;

export const useProfessionals = () => {
  const [professionals, setProfessionals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfessionals = async (filters?: {
    profession?: string; // enum value OR display label — both normalised below
    location?: string;
    search?: string;
    accountType?: "professional" | "handyman";
  }) => {
    try {
      setLoading(true);

      let query = supabase
        .from("profiles_compat_view")
        .select(COMPAT_VIEW_FIELDS)
        .in("account_type", ["professional", "handyman"])
        .order("created_at", { ascending: false });

      if (filters?.accountType) {
        query = query.eq("account_type", filters.accountType);
      }

      if (filters?.profession) {
        // Normalise display labels to enum format (e.g. "Architect" → "architect")
        const normalised = filters.profession.toLowerCase().replace(/\s+/g, "_");
        query = query.eq("profession", normalised);
      }

      if (filters?.location) {
        const sanitized = sanitizeSearchInput(filters.location);
        query = query.ilike("location", `%${sanitized}%`);
      }

      if (filters?.search) {
        const sanitized = sanitizeSearchInput(filters.search);
        query = query.or(`full_name.ilike.%${sanitized}%,profession.ilike.%${sanitized}%,bio.ilike.%${sanitized}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map raw rows to Profile shape (skills / booleans default-filled)
      const mapped: Profile[] = (data ?? []).map((row: any) => ({
        ...row,
        skills: row.skills ?? [],
        documents_uploaded: row.documents_uploaded ?? false,
        is_verified: row.is_verified ?? false,
      }));

      setProfessionals(mapped);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const getProfessionalById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles_compat_view")
        .select(COMPAT_VIEW_FIELDS)
        .eq("id", id)
        .single();

      if (error) throw error;

      const mapped: Profile = {
        ...(data as any),
        skills: (data as any).skills ?? [],
        documents_uploaded: (data as any).documents_uploaded ?? false,
        is_verified: (data as any).is_verified ?? false,
      };

      return { data: mapped, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return { professionals, loading, error, fetchProfessionals, getProfessionalById };
};
