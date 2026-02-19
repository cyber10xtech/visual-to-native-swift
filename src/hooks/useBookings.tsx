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
  booking_date: string | null;
  duration: string | null;
  amount: number;
  status: string;
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
        .select(`
          *,
          professional:profiles!bookings_pro_id_fkey(*)
        `)
        .eq("customer_id", profile.id)
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
          pro_id: bookingData.pro_id,
          service_type: bookingData.service_type,
          description: bookingData.description,
          booking_date: bookingData.booking_date,
          duration: bookingData.duration,
          amount: bookingData.amount || 0,
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
