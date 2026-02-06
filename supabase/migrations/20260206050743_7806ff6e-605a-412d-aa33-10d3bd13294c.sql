
-- 1. Create profiles_private table for sensitive contact information
CREATE TABLE public.profiles_private (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE,
  phone_number character varying NULL,
  whatsapp_number character varying NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

-- 3. Owner-only RLS policies using security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_owner_of_profile_by_profile_id(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Owners can view their own private data"
ON public.profiles_private
FOR SELECT
USING (public.is_owner_of_profile_by_profile_id(profile_id));

CREATE POLICY "Owners can insert their own private data"
ON public.profiles_private
FOR INSERT
WITH CHECK (public.is_owner_of_profile_by_profile_id(profile_id));

CREATE POLICY "Owners can update their own private data"
ON public.profiles_private
FOR UPDATE
USING (public.is_owner_of_profile_by_profile_id(profile_id));

CREATE POLICY "Owners can delete their own private data"
ON public.profiles_private
FOR DELETE
USING (public.is_owner_of_profile_by_profile_id(profile_id));

-- 4. Migrate existing data from profiles to profiles_private
INSERT INTO public.profiles_private (profile_id, phone_number, whatsapp_number)
SELECT id, phone_number, whatsapp_number
FROM public.profiles
WHERE phone_number IS NOT NULL OR whatsapp_number IS NOT NULL;

-- 5. Drop the sensitive columns from the profiles table
ALTER TABLE public.profiles DROP COLUMN phone_number;
ALTER TABLE public.profiles DROP COLUMN whatsapp_number;

-- 6. Add trigger for updated_at on profiles_private
CREATE TRIGGER update_profiles_private_updated_at
BEFORE UPDATE ON public.profiles_private
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();
