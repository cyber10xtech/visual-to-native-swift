import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCustomerProfile } from "./useCustomerProfile";
import type { Profile } from "./useProfile";

export interface Booking {
  id: string;
  customer_id: string;
  pro_id: string;
  service_type: string;
  description: string | null;
  booking_date: string;
  duration: string | null;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  amount: number;
  created_at: string;
  professional?: Profile;
}

export const useBookings = () => {
  const { user } = useAuth();
  const { profile } = useCustomerProfile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = async () => {
    if (!profile?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", profile.id)
        .order("booking_date", { ascending: false });

      if (error) throw error;

      // Fetch professional data for bookings
      const proIds = [...new Set((data || []).map(b => b.pro_id))];
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

      const bookingsWithPros = (data || []).map(b => ({
        ...b,
        professional: professionals[b.pro_id] || undefined,
      })) as Booking[];

      setBookings(bookingsWithPros);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [profile?.id]);

  const createBooking = async (bookingData: {
    pro_id: string;
    service_type: string;
    description?: string;
    booking_date: string;
    duration?: string;
    amount?: number;
  }) => {
    if (!profile?.id) return { error: new Error("No customer profile") };

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: profile.id,
          ...bookingData,
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

  const updateBookingStatus = async (bookingId: string, status: Booking["status"]) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
      await fetchBookings();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { bookings, loading, error, createBooking, updateBookingStatus, refetch: fetchBookings };
};
