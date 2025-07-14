-- Create parameter_history table for tracking parameter changes
CREATE TABLE IF NOT EXISTS public.parameter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id UUID NOT NULL REFERENCES public.statutory_parameters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- (Optional) Enable RLS and allow users in the same dairy unit to view
ALTER TABLE public.parameter_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view history for their dairy unit" ON public.parameter_history
  FOR SELECT USING (
    parameter_id IN (
      SELECT p.id FROM public.statutory_parameters p
      JOIN public.profiles prof ON prof.id = auth.uid()
      WHERE p.dairy_unit_id = prof.dairy_unit_id
    )
  ); 