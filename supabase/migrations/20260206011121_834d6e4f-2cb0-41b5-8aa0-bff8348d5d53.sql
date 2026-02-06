-- Create trigger on auth.users to auto-create customer profiles on signup
-- The function handle_new_customer_user() already exists and uses SECURITY DEFINER
-- so it bypasses RLS policies

CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer_user();