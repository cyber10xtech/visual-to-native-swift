-- Tighten the notifications INSERT policy to only allow authenticated users to create their own notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);