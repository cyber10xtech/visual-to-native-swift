
-- Drop the existing restrictive INSERT policy on notifications
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a new policy allowing authenticated users to create notifications for any user
-- This is needed so customers can notify professionals about bookings
CREATE POLICY "Authenticated users can create notifications for anyone"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
