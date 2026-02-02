-- Drop the now redundant owner-only policy since we have a public read policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;