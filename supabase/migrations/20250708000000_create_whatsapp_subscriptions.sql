-- Create whatsapp_subscriptions table to manage user WhatsApp preferences
CREATE TABLE IF NOT EXISTS public.whatsapp_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dairy_unit_id UUID NOT NULL REFERENCES public.dairy_units(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dairy_unit_id)
);

-- Add RLS to whatsapp_subscriptions
ALTER TABLE public.whatsapp_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own whatsapp subscription" ON public.whatsapp_subscriptions;
DROP POLICY IF EXISTS "Users can update their own whatsapp subscription" ON public.whatsapp_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own whatsapp subscription" ON public.whatsapp_subscriptions;

-- Users can view their own whatsapp subscription
CREATE POLICY "Users can view their own whatsapp subscription" 
  ON public.whatsapp_subscriptions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Users can update their own whatsapp subscription
CREATE POLICY "Users can update their own whatsapp subscription" 
  ON public.whatsapp_subscriptions 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Users can insert their own whatsapp subscription
CREATE POLICY "Users can insert their own whatsapp subscription" 
  ON public.whatsapp_subscriptions 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_subscriptions_user_id ON public.whatsapp_subscriptions(user_id);
CREATE INDEX idx_whatsapp_subscriptions_dairy_unit_id ON public.whatsapp_subscriptions(dairy_unit_id);
CREATE INDEX idx_whatsapp_subscriptions_is_subscribed ON public.whatsapp_subscriptions(is_subscribed);

-- Add whatsapp_number column to profiles table (safe if already exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add check constraint for WhatsApp number validation (basic format)
ALTER TABLE public.whatsapp_subscriptions 
ADD CONSTRAINT whatsapp_subscriptions_number_check 
CHECK (whatsapp_number ~* '^\+?[1-9]\d{1,14}$');

-- Create a function to automatically create WhatsApp subscription when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert whatsapp subscription for the new user (only if whatsapp_number is provided)
  IF NEW.whatsapp_number IS NOT NULL THEN
    INSERT INTO public.whatsapp_subscriptions (user_id, dairy_unit_id, whatsapp_number)
    VALUES (NEW.id, NEW.dairy_unit_id, NEW.whatsapp_number)
    ON CONFLICT (user_id, dairy_unit_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create WhatsApp subscription when profile is created
DROP TRIGGER IF EXISTS on_profile_created_whatsapp ON public.profiles;
CREATE TRIGGER on_profile_created_whatsapp
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_whatsapp();

-- Create trigger to update WhatsApp subscription when profile is updated
CREATE OR REPLACE FUNCTION public.handle_profile_update_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update whatsapp subscription if dairy unit or whatsapp number changed
  IF OLD.dairy_unit_id IS DISTINCT FROM NEW.dairy_unit_id OR OLD.whatsapp_number IS DISTINCT FROM NEW.whatsapp_number THEN
    -- Delete old subscription if dairy unit changed
    IF OLD.dairy_unit_id IS DISTINCT FROM NEW.dairy_unit_id THEN
      DELETE FROM public.whatsapp_subscriptions 
      WHERE user_id = NEW.id AND dairy_unit_id = OLD.dairy_unit_id;
    END IF;
    -- Insert new subscription for new dairy unit
    IF NEW.dairy_unit_id IS NOT NULL AND NEW.whatsapp_number IS NOT NULL THEN
      INSERT INTO public.whatsapp_subscriptions (user_id, dairy_unit_id, whatsapp_number)
      VALUES (NEW.id, NEW.dairy_unit_id, NEW.whatsapp_number)
      ON CONFLICT (user_id, dairy_unit_id) 
      DO UPDATE SET 
        whatsapp_number = EXCLUDED.whatsapp_number,
        updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle profile updates for WhatsApp
DROP TRIGGER IF EXISTS on_profile_updated_whatsapp ON public.profiles;
CREATE TRIGGER on_profile_updated_whatsapp
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update_whatsapp();

-- Create whatsapp_logs table to track WhatsApp message delivery
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dairy_unit_id UUID REFERENCES public.dairy_units(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'reminder' or 'expiry'
  parameter_id UUID REFERENCES public.statutory_parameters(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS to whatsapp_logs
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own whatsapp logs
CREATE POLICY "Users can view their own whatsapp logs" 
  ON public.whatsapp_logs 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create indexes for whatsapp_logs
CREATE INDEX idx_whatsapp_logs_user_id ON public.whatsapp_logs(user_id);
CREATE INDEX idx_whatsapp_logs_dairy_unit_id ON public.whatsapp_logs(dairy_unit_id);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_logs(status);
CREATE INDEX idx_whatsapp_logs_sent_at ON public.whatsapp_logs(sent_at DESC);

-- Create view for WhatsApp subscription summary
CREATE OR REPLACE VIEW whatsapp_subscription_summary_view AS
SELECT 
  du.id as dairy_unit_id,
  du.name as dairy_unit_name,
  COUNT(ws.id) as total_subscriptions,
  COUNT(ws.id) FILTER (WHERE ws.is_subscribed = true) as active_subscriptions,
  COUNT(ws.id) FILTER (WHERE ws.is_subscribed = false) as inactive_subscriptions,
  ROUND(
    (COUNT(ws.id) FILTER (WHERE ws.is_subscribed = true)::numeric / NULLIF(COUNT(ws.id)::numeric, 0)) * 100, 
    2
  ) as subscription_rate
FROM dairy_units du
LEFT JOIN whatsapp_subscriptions ws ON du.id = ws.dairy_unit_id
GROUP BY du.id, du.name;

-- Grant appropriate permissions to views
GRANT SELECT ON whatsapp_subscription_summary_view TO authenticated;

-- Add RLS policies for views
ALTER VIEW whatsapp_subscription_summary_view SET (security_invoker = true); 