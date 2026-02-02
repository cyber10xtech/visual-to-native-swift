-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  account_type VARCHAR NOT NULL CHECK (account_type IN ('professional', 'handyman')),
  full_name VARCHAR NOT NULL,
  profession VARCHAR,
  bio TEXT,
  location VARCHAR,
  phone_number VARCHAR,
  whatsapp_number VARCHAR,
  daily_rate VARCHAR,
  contract_rate VARCHAR,
  skills TEXT[] DEFAULT '{}',
  documents_uploaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check profile ownership
CREATE OR REPLACE FUNCTION public.is_owner_of_profile(profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_user_id
$$;

-- RLS Policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to prevent account_type changes after creation
CREATE OR REPLACE FUNCTION public.prevent_account_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.account_type IS DISTINCT FROM NEW.account_type THEN
    RAISE EXCEPTION 'Cannot change account type after profile creation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_account_type_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_account_type_change();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Create a public view for profile discovery (other users can see basic info)
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  account_type,
  full_name,
  profession,
  bio,
  location,
  daily_rate,
  contract_rate,
  skills
FROM public.profiles;