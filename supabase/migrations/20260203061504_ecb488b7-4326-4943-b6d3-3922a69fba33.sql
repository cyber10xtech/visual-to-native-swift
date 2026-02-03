-- Drop the foreign key constraint on profiles.user_id to allow demo/test data
-- This allows professionals to be added without requiring an auth.users entry

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;