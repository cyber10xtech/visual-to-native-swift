import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "./useProfile";

const escapeIlikePattern = (str: string): string => str.replace(/[%_\\]/g, "\\$&");
const sanitizeSearchInput = (input: string, maxLength = 100): string =>
  escapeIlikePattern(input.trim().slice(0, maxLength));

export const useProfessionals = () => {
  const [professionals, setProfessionals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfessionals = async (filters?: {
    profession?: string;
    location?: string;
    search?: string;
    accountType?: "professional" | "handyman";
  }) => {
    try {
      setLoading(true);

      // Read from profiles_public view (safe columns only)
      let query = supabase
        .from("profiles_public")
        .select("*")
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.accountType) {
        query = query.eq("account_type", filters.accountType);
      }

      if (filters?.profession) {
        const sanitized = sanitizeSearchInput(filters.profession);
        query = query.ilike("profession", `%${sanitized}%`);
      }

      if (filters?.location) {
        const sanitized = sanitizeSearchInput(filters.location);
        query = query.ilike("location", `%${sanitized}%`);
      }

      if (filters?.search) {
        const sanitized = sanitizeSearchInput(filters.search);
        query = query.or(
          `full_name.ilike.%${sanitized}%,profession.ilike.%${sanitized}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Profile[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id ?? null,
        account_type: row.account_type ?? null,
        full_name: row.full_name,
        profession: row.profession ?? null,
        bio: row.bio ?? null,
        location: row.location ?? null,
        daily_rate: row.daily_rate ?? null,
        contract_rate: row.contract_rate ?? null,
        skills: row.skills ?? [],
        avatar_url: row.avatar_url ?? null,
        documents_uploaded: row.documents_uploaded ?? false,
        is_verified: row.is_verified ?? false,
        created_at: row.created_at,
        updated_at: row.updated_at ?? row.created_at,
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
        .from("profiles_public")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const d = data as any;
      const mapped: Profile = {
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
      };

      return { data: mapped, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return { professionals, loading, error, fetchProfessionals, getProfessionalById };
};
