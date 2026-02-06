-- Add missing avatar_url column to profiles table (exists in business app)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;
