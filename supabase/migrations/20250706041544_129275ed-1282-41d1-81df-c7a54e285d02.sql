
-- Enable realtime for parameter_history table
ALTER TABLE public.parameter_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parameter_history;

-- Add missing INSERT policy for parameter_history
CREATE POLICY "Users can insert parameter history for their dairy unit" 
  ON public.parameter_history 
  FOR INSERT 
  WITH CHECK (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

-- Add UPDATE policy for parameter_history (for future functionality)
CREATE POLICY "Users can update parameter history for their dairy unit" 
  ON public.parameter_history 
  FOR UPDATE 
  USING (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));
