import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerProfile } from "./useCustomerProfile";
import type { Profile } from "./useProfile";

export interface Favorite {
  id: string;
  customer_id: string;
  pro_id: string;
  created_at: string;
  professional?: Profile;
}

export const useFavorites = () => {
  const { profile } = useCustomerProfile();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFavorites = async () => {
    if (!profile?.id) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch professional data
      const proIds = [...new Set((data || []).map(f => f.pro_id))];
      let professionals: Record<string, Profile> = {};
      if (proIds.length > 0) {
        const { data: proData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", proIds);
        if (proData) {
          professionals = Object.fromEntries(proData.map(p => [p.id, p as unknown as Profile]));
        }
      }

      const favsWithPros = (data || []).map(f => ({
        ...f,
        professional: professionals[f.pro_id] || undefined,
      })) as Favorite[];

      setFavorites(favsWithPros);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [profile?.id]);

  const addFavorite = async (professionalId: string) => {
    if (!profile?.id) return { error: new Error("No customer profile") };

    try {
      const { error } = await supabase
        .from("favorites")
        .insert({
          customer_id: profile.id,
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
    if (!profile?.id) return { error: new Error("No customer profile") };

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("customer_id", profile.id)
        .eq("pro_id", professionalId);

      if (error) throw error;
      await fetchFavorites();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const isFavorite = (professionalId: string) => {
    return favorites.some(f => f.pro_id === professionalId);
  };

  return { favorites, loading, error, addFavorite, removeFavorite, isFavorite, refetch: fetchFavorites };
};
