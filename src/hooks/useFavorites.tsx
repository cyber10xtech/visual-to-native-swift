import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Favorite {
  id: string;
  customer_id: string;
  professional_id: string;
  created_at: string;
  professional?: {
    id: string;
    full_name: string;
    profession: string | null;
    location: string | null;
    daily_rate: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export const useFavorites = () => {
  const { customerProfileId } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFavorites = async () => {
    if (!customerProfileId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("customer_id", customerProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch professional info from profiles_public
      const favsWithPro: Favorite[] = await Promise.all(
        (data || []).map(async (f: any) => {
          const proId = f.professional_id || f.pro_id;
          const { data: pro } = await supabase
            .from("profiles_public")
            .select("id, full_name, profession, location, daily_rate, avatar_url, is_verified")
            .eq("id", proId)
            .maybeSingle();

          return {
            id: f.id,
            customer_id: f.customer_id,
            professional_id: proId,
            created_at: f.created_at,
            professional: pro
              ? { ...pro, is_verified: pro.is_verified ?? false }
              : undefined,
          };
        })
      );

      setFavorites(favsWithPro);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [customerProfileId]);

  const addFavorite = async (professionalId: string) => {
    if (!customerProfileId) return { error: new Error("No profile found") };

    try {
      const { error } = await supabase.from("favorites").insert({
        customer_id: customerProfileId,
        professional_id: professionalId,
      });

      if (error) throw error;
      await fetchFavorites();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const removeFavorite = async (professionalId: string) => {
    if (!customerProfileId) return { error: new Error("No profile found") };

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("customer_id", customerProfileId)
        .eq("professional_id", professionalId);

      if (error) throw error;
      await fetchFavorites();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const isFavorite = (professionalId: string) => {
    return favorites.some((f) => f.professional_id === professionalId);
  };

  return { favorites, loading, error, addFavorite, removeFavorite, isFavorite, refetch: fetchFavorites };
};
