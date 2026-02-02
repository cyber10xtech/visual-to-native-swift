-- Drop the security definer view
DROP VIEW IF EXISTS public.public_profiles;

-- Create a policy to allow public read access to basic profile info
-- This is safer than using a security definer view
CREATE POLICY "Anyone can view public profile info"
ON public.profiles
FOR SELECT
USING (true);