-- Create email_subscriptions table to manage user email preferences
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dairy_unit_id UUID NOT NULL REFERENCES public.dairy_units(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one subscription per user per dairy unit
  UNIQUE(user_id, dairy_unit_id)
);

-- Add RLS to email_subscriptions
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can update their own email subscription" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own email subscription" ON public.email_subscriptions;

-- Users can view their own email subscription
CREATE POLICY "Users can view their own email subscription" 
  ON public.email_subscriptions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Users can update their own email subscription
CREATE POLICY "Users can update their own email subscription" 
  ON public.email_subscriptions 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Users can insert their own email subscription
CREATE POLICY "Users can insert their own email subscription" 
  ON public.email_subscriptions 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance (IF NOT EXISTS not supported for indexes, so we'll drop and recreate)
DROP INDEX IF EXISTS idx_email_subscriptions_user_id;
DROP INDEX IF EXISTS idx_email_subscriptions_dairy_unit_id;
DROP INDEX IF EXISTS idx_email_subscriptions_is_subscribed;

CREATE INDEX idx_email_subscriptions_user_id ON public.email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_dairy_unit_id ON public.email_subscriptions(dairy_unit_id);
CREATE INDEX idx_email_subscriptions_is_subscribed ON public.email_subscriptions(is_subscribed);

-- Create a function to automatically create subscription when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert email subscription for the new user
  INSERT INTO public.email_subscriptions (user_id, dairy_unit_id, email_address)
  VALUES (NEW.id, NEW.dairy_unit_id, NEW.email)
  ON CONFLICT (user_id, dairy_unit_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create subscription when profile is created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to update subscription when profile is updated
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email subscription if dairy unit or email changed
  IF OLD.dairy_unit_id IS DISTINCT FROM NEW.dairy_unit_id OR OLD.email IS DISTINCT FROM NEW.email THEN
    -- Delete old subscription if dairy unit changed
    IF OLD.dairy_unit_id IS DISTINCT FROM NEW.dairy_unit_id THEN
      DELETE FROM public.email_subscriptions 
      WHERE user_id = NEW.id AND dairy_unit_id = OLD.dairy_unit_id;
    END IF;
    
    -- Insert new subscription for new dairy unit
    IF NEW.dairy_unit_id IS NOT NULL AND NEW.email IS NOT NULL THEN
      INSERT INTO public.email_subscriptions (user_id, dairy_unit_id, email_address)
      VALUES (NEW.id, NEW.dairy_unit_id, NEW.email)
      ON CONFLICT (user_id, dairy_unit_id) 
      DO UPDATE SET 
        email_address = EXCLUDED.email_address,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle profile updates
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update(); 