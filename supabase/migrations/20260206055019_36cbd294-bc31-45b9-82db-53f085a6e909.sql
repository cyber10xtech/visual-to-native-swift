
-- ============================================
-- UNIFIED DATABASE SCHEMA MIGRATION
-- ============================================

-- 0. Fix account_type constraint to include 'customer'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check 
  CHECK (account_type::text = ANY (ARRAY['professional', 'handyman', 'customer']));

-- 1. Create enums
CREATE TYPE public.booking_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. Add customer-specific columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referral_credits numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

ALTER TABLE public.profiles ALTER COLUMN account_type DROP NOT NULL;

-- 5. Migrate customer_profiles data into unified profiles
INSERT INTO public.profiles (id, user_id, full_name, email, account_type, address, city, zip_code, avatar_url, referral_code, referral_credits, created_at, updated_at)
SELECT cp.id, cp.user_id, cp.full_name, cp.email, 'customer', cp.address, cp.city, cp.zip_code, cp.avatar_url, cp.referral_code, COALESCE(cp.referral_credits, 0), cp.created_at, cp.updated_at
FROM public.customer_profiles cp
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = cp.user_id);

INSERT INTO public.user_roles (user_id, role)
SELECT cp.user_id, 'user'::app_role
FROM public.customer_profiles cp
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update customer registration trigger
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, account_type, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'customer',
    'SAFE' || UPPER(LEFT(NEW.id::text, 6))
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 7. Restructure bookings
ALTER TABLE public.bookings RENAME COLUMN professional_id TO pro_id;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS duration text;

UPDATE public.bookings SET booking_date = created_at WHERE booking_date IS NULL;
UPDATE public.bookings SET amount = COALESCE(rate_amount, 0) WHERE amount = 0;
UPDATE public.bookings SET status = UPPER(status);

ALTER TABLE public.bookings
  DROP COLUMN IF EXISTS scheduled_date,
  DROP COLUMN IF EXISTS scheduled_time,
  DROP COLUMN IF EXISTS rate_amount,
  DROP COLUMN IF EXISTS rate_type,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS updated_at;

-- 8. Restructure conversations
ALTER TABLE public.conversations RENAME COLUMN professional_id TO pro_id;
ALTER TABLE public.conversations DROP COLUMN IF EXISTS last_message_at;

-- 9. Restructure messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
UPDATE public.messages SET is_read = (read_at IS NOT NULL) WHERE read_at IS NOT NULL;
ALTER TABLE public.messages DROP COLUMN IF EXISTS read_at;
ALTER TABLE public.messages DROP COLUMN IF EXISTS sender_type;

-- 10. Restructure notifications
ALTER TABLE public.notifications RENAME COLUMN message TO description;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
UPDATE public.notifications SET is_read = COALESCE(read, false);
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS user_type;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS data;

-- 11. Rename professional_id to pro_id in favorites and reviews
ALTER TABLE public.favorites RENAME COLUMN professional_id TO pro_id;
ALTER TABLE public.reviews RENAME COLUMN professional_id TO pro_id;

-- 12. Create pro_stats table
CREATE TABLE public.pro_stats (
  pro_id uuid PRIMARY KEY,
  jobs integer DEFAULT 0,
  earnings numeric DEFAULT 0,
  rating numeric DEFAULT 5.0,
  views integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.pro_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pro stats"
ON public.pro_stats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pros can insert their own stats"
ON public.pro_stats FOR INSERT TO authenticated
WITH CHECK (pro_id = get_my_profile_id());

CREATE POLICY "Pros can update their own stats"
ON public.pro_stats FOR UPDATE TO authenticated
USING (pro_id = get_my_profile_id());

-- 13. Drop ALL old RLS policies
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their bookings" ON public.bookings;

DROP POLICY IF EXISTS "Customers can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;

DROP POLICY IF EXISTS "Customers can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Customers can view their favorites" ON public.favorites;
DROP POLICY IF EXISTS "Customers can remove favorites" ON public.favorites;

DROP POLICY IF EXISTS "Customers can create reviews for their bookings" ON public.reviews;
DROP POLICY IF EXISTS "Customers can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can delete their own reviews" ON public.reviews;

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

DROP POLICY IF EXISTS "Authenticated users can browse professional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own customer profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users can create their own customer profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users can update their own customer profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users can delete their own customer profile" ON public.customer_profiles;

-- 14. Create new unified RLS policies

CREATE POLICY "Authenticated users can browse profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (customer_id = get_my_profile_id() OR pro_id = get_my_profile_id());

CREATE POLICY "Customers can create bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (customer_id = get_my_profile_id());

CREATE POLICY "Users can update their bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (customer_id = get_my_profile_id() OR pro_id = get_my_profile_id());

CREATE POLICY "Users can delete their own bookings"
ON public.bookings FOR DELETE TO authenticated
USING (customer_id = get_my_profile_id() OR pro_id = get_my_profile_id());

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (customer_id = get_my_profile_id() OR pro_id = get_my_profile_id());

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (customer_id = get_my_profile_id());

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (customer_id = get_my_profile_id() OR pro_id = get_my_profile_id());

CREATE POLICY "Users can delete their conversations"
ON public.conversations FOR DELETE TO authenticated
USING (customer_id = get_my_profile_id() OR pro_id = get_my_profile_id());

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT TO authenticated
USING (conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_id = get_my_profile_id() OR pro_id = get_my_profile_id()
));

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_id = get_my_profile_id() OR pro_id = get_my_profile_id()
));

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE TO authenticated
USING (sender_id = get_my_profile_id());

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE TO authenticated
USING (sender_id = get_my_profile_id());

CREATE POLICY "Customers can view their favorites"
ON public.favorites FOR SELECT TO authenticated
USING (customer_id = get_my_profile_id());

CREATE POLICY "Customers can add favorites"
ON public.favorites FOR INSERT TO authenticated
WITH CHECK (customer_id = get_my_profile_id());

CREATE POLICY "Customers can remove favorites"
ON public.favorites FOR DELETE TO authenticated
USING (customer_id = get_my_profile_id());

CREATE POLICY "Customers can create reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (customer_id = get_my_profile_id());

CREATE POLICY "Customers can update their own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (customer_id = get_my_profile_id());

CREATE POLICY "Customers can delete their own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (customer_id = get_my_profile_id());

-- 15. Drop customer_profiles table
DROP TABLE IF EXISTS public.customer_profiles CASCADE;
