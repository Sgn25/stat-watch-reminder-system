
-- Update RLS policies for statutory_parameters to allow dairy unit-wide access
DROP POLICY IF EXISTS "Users can view their dairy unit parameters" ON public.statutory_parameters;
DROP POLICY IF EXISTS "Users can create their dairy unit parameters" ON public.statutory_parameters;
DROP POLICY IF EXISTS "Users can update their dairy unit parameters" ON public.statutory_parameters;
DROP POLICY IF EXISTS "Users can delete their dairy unit parameters" ON public.statutory_parameters;

-- Create new policies for dairy unit-wide access to statutory_parameters
CREATE POLICY "Users can view parameters for their dairy unit" 
  ON public.statutory_parameters 
  FOR SELECT 
  USING (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create parameters for their dairy unit" 
  ON public.statutory_parameters 
  FOR INSERT 
  WITH CHECK (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update parameters for their dairy unit" 
  ON public.statutory_parameters 
  FOR UPDATE 
  USING (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete parameters for their dairy unit" 
  ON public.statutory_parameters 
  FOR DELETE 
  USING (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Create email_logs table for tracking email activities
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  emails_sent INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS to email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view email logs for their dairy unit's reminders
CREATE POLICY "Users can view email logs for their dairy unit" 
  ON public.email_logs 
  FOR SELECT 
  USING (reminder_id IN (
    SELECT r.id FROM public.reminders r
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.dairy_unit_id = p.dairy_unit_id
  ));

-- Allow system to insert email logs
CREATE POLICY "System can insert email logs" 
  ON public.email_logs 
  FOR INSERT 
  WITH CHECK (true);
