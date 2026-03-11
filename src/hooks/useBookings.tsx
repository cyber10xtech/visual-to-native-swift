import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Booking {
  id: string;
  customer_id: string;
  professional_id: string;
  service_type: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  rate_type: string | null;
  rate_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  professional?: {
    id: string;
    full_name: string;
    profession: string | null;
    avatar_url: string | null;
    location: string | null;
    user_id: string | null;
  };
}

export const useBookings = () => {
  const { customerProfileId } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = async () => {
    if (!customerProfileId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", customerProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch professional info for each booking from profiles_public
      const bookingsWithPro: Booking[] = await Promise.all(
        (data || []).map(async (b: any) => {
          const { data: pro } = await supabase
            .from("profiles_public")
            .select("id, full_name, profession, avatar_url, location, user_id")
            .eq("id", b.professional_id)
            .maybeSingle();

          return {
            id: b.id,
            customer_id: b.customer_id,
            professional_id: b.professional_id,
            service_type: b.service_type,
            description: b.description ?? null,
            scheduled_date: b.scheduled_date ?? null,
            scheduled_time: b.scheduled_time ?? null,
            rate_type: b.rate_type ?? null,
            rate_amount: b.rate_amount ?? b.amount ?? 0,
            status: b.status,
            notes: b.notes ?? null,
            created_at: b.created_at,
            professional: pro
              ? {
                  id: pro.id,
                  full_name: pro.full_name,
                  profession: pro.profession,
                  avatar_url: pro.avatar_url,
                  location: pro.location,
                  user_id: pro.user_id,
                }
              : undefined,
          };
        })
      );

      setBookings(bookingsWithPro);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [customerProfileId]);

  // Realtime subscription for booking status changes
  useEffect(() => {
    if (!customerProfileId) return;

    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `customer_id=eq.${customerProfileId}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerProfileId]);

  const createBooking = async (bookingData: {
    professional_id: string;
    service_type: string;
    description?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    rate_type?: string;
    rate_amount?: number;
    notes?: string;
  }) => {
    if (!customerProfileId) return { error: new Error("No customer profile found"), data: null };

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: customerProfileId,
          professional_id: bookingData.professional_id,
          service_type: bookingData.service_type,
          description: bookingData.description ?? null,
          scheduled_date: bookingData.scheduled_date ?? null,
          scheduled_time: bookingData.scheduled_time ?? null,
          rate_type: bookingData.rate_type ?? null,
          rate_amount: bookingData.rate_amount ?? 0,
          notes: bookingData.notes ?? null,
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
