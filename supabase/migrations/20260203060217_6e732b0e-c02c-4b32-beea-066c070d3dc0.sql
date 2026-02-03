-- Create a function to auto-create customer profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for customer signups
-- Note: This will create a basic profile, the app can update it later
DROP TRIGGER IF EXISTS on_customer_auth_user_created ON auth.users;
CREATE TRIGGER on_customer_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer_user();