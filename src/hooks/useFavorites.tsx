import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Profile } from "./useProfile";

export interface Favorite {
  id: string;
  customer_id: string;
  pro_id: string;
  created_at: string;
  professional?: Profile;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setProfileId(null); return; }
    supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfileId(data?.id ?? null));
  }, [user]);

  const fetchFavorites = async () => {
    if (!profileId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          *,
          professional:profiles!favorites_professional_id_fkey(
            id, user_id, account_type, full_name, profession,
            bio, location, daily_rate, contract_rate,
            skills, avatar_url, documents_uploaded, is_verified,
            created_at, updated_at
          )
        `)
        .eq("customer_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites((data as unknown as Favorite[]) || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [profileId]);

  const addFavorite = async (professionalId: string) => {
    if (!profileId) return { error: new Error("No profile found") };

    try {
      const { error } = await supabase.from("favorites").insert({
        customer_id: profileId,
        pro_id: professionalId,
      });

      if (error) throw error;
      await fetchFavorites();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const removeFavorite = async (professionalId: string) => {
    if (!profileId) return { error: new Error("No profile found") };

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("customer_id", profileId)
        .eq("pro_id", professionalId);

      if (error) throw error;
      await fetchFavorites();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const isFavorite = (professionalId: string) => {
    return favorites.some((f) => f.pro_id === professionalId);
  };

  return { favorites, loading, error, addFavorite, removeFavorite, isFavorite, refetch: fetchFavorites };
};
