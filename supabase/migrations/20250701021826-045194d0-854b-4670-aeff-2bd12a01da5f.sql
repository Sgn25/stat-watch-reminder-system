
-- Create a new reminders table to store individual reminders for parameters
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parameter_id UUID NOT NULL REFERENCES public.statutory_parameters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  dairy_unit_id UUID,
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  custom_message TEXT,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reminders table
CREATE POLICY "Users can view reminders for their dairy unit" 
  ON public.reminders 
  FOR SELECT 
  USING (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create reminders for their dairy unit" 
  ON public.reminders 
  FOR INSERT 
  WITH CHECK (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update reminders for their dairy unit" 
  ON public.reminders 
  FOR UPDATE 
  USING (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete reminders for their dairy unit" 
  ON public.reminders 
  FOR DELETE 
  USING (dairy_unit_id IN (
    SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Create an index for better performance on queries
CREATE INDEX idx_reminders_parameter_id ON public.reminders(parameter_id);
CREATE INDEX idx_reminders_dairy_unit_id ON public.reminders(dairy_unit_id);
CREATE INDEX idx_reminders_date_time ON public.reminders(reminder_date, reminder_time);
