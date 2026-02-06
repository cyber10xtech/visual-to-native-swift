
-- Add DELETE policy on bookings for customers and professionals
CREATE POLICY "Users can delete their own bookings"
ON public.bookings
FOR DELETE
USING (
  (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  OR
  (professional_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Add UPDATE and DELETE policies on conversations for participants
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
USING (
  (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  OR
  (professional_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
USING (
  (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  OR
  (professional_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Add DELETE policy on customer_profiles for owner
CREATE POLICY "Users can delete their own customer profile"
ON public.customer_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy on profiles for owner
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add UPDATE and DELETE policies on reviews for authors
CREATE POLICY "Customers can update their own reviews"
ON public.reviews
FOR UPDATE
USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Customers can delete their own reviews"
ON public.reviews
FOR DELETE
USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

-- Add UPDATE policy on push_subscriptions for owner
CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);
