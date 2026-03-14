import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  customerProfileId: string | null;
  hasCustomerProfile: boolean | null;
  signUp: (email: string, password: string, profileData: CustomerProfileData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCustomerProfile: () => Promise<void>;
}

export interface CustomerProfileData {
  fullName: string;
  phone?: string;
  city?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerProfileId, setCustomerProfileId] = useState<string | null>(null);
  const [hasCustomerProfile, setHasCustomerProfile] = useState<boolean | null>(null);
  const initializedRef = useRef(false);

  const checkCustomerProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile check error:", error);
        setHasCustomerProfile(false);
        setCustomerProfileId(null);
        return;
      }

      setCustomerProfileId(data?.id ?? null);
      setHasCustomerProfile(data !== null);
    } catch {
      setHasCustomerProfile(false);
      setCustomerProfileId(null);
    }
  };

  const refreshCustomerProfile = async () => {
    if (user) await checkCustomerProfile(user.id);
  };

  useEffect(() => {
    // Listen for auth changes — this fires immediately with the current session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {