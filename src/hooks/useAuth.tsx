import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  customerProfileId: string | null;
  hasCustomerProfile: boolean | null; // null = still checking
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

  const checkCustomerProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      setCustomerProfileId(data?.id ?? null);
      setHasCustomerProfile(!!data);
    } catch {
      setHasCustomerProfile(false);
      setCustomerProfileId(null);
    }
  };

  const refreshCustomerProfile = async () => {
    if (user) await checkCustomerProfile(user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkCustomerProfile(session.user.id);
      } else {
        setCustomerProfileId(null);
        setHasCustomerProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkCustomerProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    profileData: CustomerProfileData,
  ): Promise<{ error: Error | null }> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: {
            full_name: profileData.fullName,
            account_type: "customer",
          },
        },
      });

      if (error) throw error;

      // Insert customer_profiles row
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("customer_profiles")
          .insert({
            user_id: authData.user.id,
            full_name: profileData.fullName,
            email,
            phone: profileData.phone || null,
            city: profileData.city || null,
            referral_code: "SS" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCustomerProfileId(null);
    setHasCustomerProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        customerProfileId,
        hasCustomerProfile,
        signUp,
        signIn,
        signOut,
        refreshCustomerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
