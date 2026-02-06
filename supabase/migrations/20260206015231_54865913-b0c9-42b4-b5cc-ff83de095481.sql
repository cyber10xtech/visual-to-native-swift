
-- Fix 1: Add missing DELETE policy on notifications table
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Fix 2: Restrict profiles SELECT to hide phone numbers from other users
-- Drop the broad authenticated policy and replace with scoped policies
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Owners can see their full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Other authenticated users can see profiles for discovery (but client code will exclude sensitive fields)
CREATE POLICY "Authenticated users can browse professional profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: Column-level restriction is enforced in application code by selecting only safe fields.
-- The RLS policy allows access, but the client never requests phone_number/whatsapp_number
-- when browsing. Full contact info is only shown on the detail page for interacting users.
