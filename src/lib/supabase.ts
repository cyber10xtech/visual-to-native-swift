import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jaiigoiifoxxnojydotu.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWlnb2lpZm94eG5vanlkb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDE2MjAsImV4cCI6MjA4NzkxNzYyMH0._CuHXqEFwbJg9uLuGldY43PgZyn-W2LAVEODY1CJ08U";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const EXTERNAL_SUPABASE_URL = SUPABASE_URL;
