
-- Fix: Replace public SELECT policies on profiles with authenticated-only access
-- This prevents unauthenticated scraping of phone numbers while still letting
-- logged-in customers browse professionals.

DROP POLICY IF EXISTS "Anyone can view professional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
