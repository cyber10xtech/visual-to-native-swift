import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cqszwtmoyyjjvcbbczsr.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxc3p3dG1veXlqanZjYmJjenNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Mzg2OTQsImV4cCI6MjA4OTAxNDY5NH0.cKpWz7ShRvZocD2VUxfmpnaveN8I2qOeVNqecmwf9Lk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const EXTERNAL_SUPABASE_URL = SUPABASE_URL;
