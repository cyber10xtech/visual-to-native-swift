import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCustomerProfile } from "./useCustomerProfile";
import type { Profile } from "./useProfile";

// Unified schema column mapping (old → new):
//   pro_id       → professional_id
//   booking_date → scheduled_date  (DATE type, not TIMESTAMPTZ)
//   amount       → rate_amount
//   + new required field: service_category ('professional' | 'handyman')

export interface Booking {
  id: string;
  customer_id: string; // customer_profiles.id
  professional_id: string; // profiles.id
  service_type: string;
  service_category: string;
  description: string | null;
  scheduled_date: string | null; // DATE
  scheduled_time: string | null; // TIME
  duration: string | null;
  rate_amount: number | null;
  rate_type: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  professional?: Profile; // joined via select
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
      // Join professional profile data via the FK
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          professional:profiles!bookings_professional_id_fkey(
            id, user_id, account_type, full_name, profession_specialty,
            handyman_specialty, bio, location, daily_rate, contract_rate,
            skills, avatar_url, documents_uploaded, is_verified,
            created_at, updated_at
          )
        `,
        )
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
    professional_id: string;
    service_type: string;
    service_category: "professional" | "handyman"; // required by unified schema
    description?: string;
    scheduled_date: string; // DATE string: "YYYY-MM-DD"
    scheduled_time?: string; // TIME string: "HH:MM"
    duration?: string;
    rate_amount?: number;
    rate_type?: "daily" | "hourly" | "project" | "contract";
    notes?: string;
  }) => {
    if (!profile?.id) return { error: new Error("No customer profile") };

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: profile.id,
          professional_id: bookingData.professional_id,
          service_type: bookingData.service_type,
          service_category: bookingData.service_category,
          description: bookingData.description ?? null,
          scheduled_date: bookingData.scheduled_date,
          scheduled_time: bookingData.scheduled_time ?? null,
          duration: bookingData.duration ?? null,
          rate_amount: bookingData.rate_amount ?? null,
          rate_type: bookingData.rate_type ?? null,
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
