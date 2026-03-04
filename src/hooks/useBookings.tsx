import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Profile } from "./useProfile";

export interface Booking {
  id: string;
  customer_id: string;
  pro_id: string;
  service_type: string;
  description: string | null;
  booking_date: string | null;
  duration: string | null;
  amount: number;
  status: string;
  created_at: string;
  professional?: Profile;
}

export const useBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Get profile id for current user
  useEffect(() => {
    if (!user) { setProfileId(null); return; }
    supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfileId(data?.id ?? null));
  }, [user]);

  const fetchBookings = async () => {
    if (!profileId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          professional:profiles!bookings_professional_id_fkey(
            id, user_id, account_type, full_name, profession,
            bio, location, daily_rate, contract_rate,
            skills, avatar_url, documents_uploaded, is_verified,
            created_at, updated_at
          )
        `)
        .eq("customer_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings((data as unknown as Booking[]) || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [profileId]);

  const createBooking = async (bookingData: {
    pro_id: string;
    service_type: string;
    description?: string;
    booking_date?: string;
    duration?: string;
    amount?: number;
  }) => {
    if (!profileId) return { error: new Error("No profile found") };

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: profileId,
          pro_id: bookingData.pro_id,
          service_type: bookingData.service_type,
          description: bookingData.description ?? null,
          booking_date: bookingData.booking_date ?? null,
          duration: bookingData.duration ?? null,
          amount: bookingData.amount ?? 0,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      await fetchBookings();
      return { error: null, data };
    } catch (err) {
      return { error: err as Error, data: null };
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
      if (error) throw error;
      await fetchBookings();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { bookings, loading, error, createBooking, updateBookingStatus, refetch: fetchBookings };
};
