-- Update the function to also store referral code and use metadata properly
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.customer_profiles (user_id, full_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'SAFE' || UPPER(LEFT(NEW.id::text, 6))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;