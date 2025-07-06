-- Fix email_subscriptions table policies
-- Run this in your Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can update their own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own email subscription" ON public.email_subscriptions;

-- Recreate the policies
CREATE POLICY "Users can view their own email subscription" 
  ON public.email_subscriptions 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own email subscription" 
  ON public.email_subscriptions 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email subscription" 
  ON public.email_subscriptions 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Drop and recreate indexes
DROP INDEX IF EXISTS idx_email_subscriptions_user_id;
DROP INDEX IF EXISTS idx_email_subscriptions_dairy_unit_id;
DROP INDEX IF EXISTS idx_email_subscriptions_is_subscribed;

CREATE INDEX idx_email_subscriptions_user_id ON public.email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_dairy_unit_id ON public.email_subscriptions(dairy_unit_id);
CREATE INDEX idx_email_subscriptions_is_subscribed ON public.email_subscriptions(is_subscribed);

-- Create or replace the functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert email subscription for the new user
  INSERT INTO public.email_subscriptions (user_id, dairy_unit_id, email_address)
  VALUES (NEW.id, NEW.dairy_unit_id, (SELECT email FROM auth.users WHERE id = NEW.id))
  ON CONFLICT (user_id, dairy_unit_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email subscription if dairy unit changed
  IF OLD.dairy_unit_id IS DISTINCT FROM NEW.dairy_unit_id THEN
    -- Delete old subscription if dairy unit changed
    IF OLD.dairy_unit_id IS NOT NULL THEN
      DELETE FROM public.email_subscriptions 
      WHERE user_id = NEW.id AND dairy_unit_id = OLD.dairy_unit_id;
    END IF;
    
    -- Insert new subscription for new dairy unit
    IF NEW.dairy_unit_id IS NOT NULL THEN
      INSERT INTO public.email_subscriptions (user_id, dairy_unit_id, email_address)
      VALUES (NEW.id, NEW.dairy_unit_id, (SELECT email FROM auth.users WHERE id = NEW.id))
      ON CONFLICT (user_id, dairy_unit_id) 
      DO UPDATE SET 
        email_address = EXCLUDED.email_address,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update();

-- Insert existing users into email_subscriptions if they don't exist
INSERT INTO public.email_subscriptions (user_id, dairy_unit_id, email_address)
SELECT p.id, p.dairy_unit_id, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.dairy_unit_id IS NOT NULL 
  AND u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.email_subscriptions es 
    WHERE es.user_id = p.id AND es.dairy_unit_id = p.dairy_unit_id
  ); 