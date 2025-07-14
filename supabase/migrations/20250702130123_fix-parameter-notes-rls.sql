-- Drop existing policies for parameter_notes
DROP POLICY IF EXISTS "Users can view parameter notes for their dairy unit" ON public.parameter_notes;
DROP POLICY IF EXISTS "Users can insert parameter notes for their dairy unit" ON public.parameter_notes;
DROP POLICY IF EXISTS "Users can update parameter notes for their dairy unit" ON public.parameter_notes;
DROP POLICY IF EXISTS "Users can delete parameter notes for their dairy unit" ON public.parameter_notes;

-- Create simpler, more robust policies for parameter_notes
CREATE POLICY "Users can view parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.statutory_parameters sp
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE sp.id = parameter_notes.parameter_id 
      AND sp.dairy_unit_id = p.dairy_unit_id
      AND p.dairy_unit_id IS NOT NULL
    )
  );

CREATE POLICY "Users can insert parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.statutory_parameters sp
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE sp.id = parameter_notes.parameter_id 
      AND sp.dairy_unit_id = p.dairy_unit_id
      AND p.dairy_unit_id IS NOT NULL
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.statutory_parameters sp
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE sp.id = parameter_notes.parameter_id 
      AND sp.dairy_unit_id = p.dairy_unit_id
      AND p.dairy_unit_id IS NOT NULL
    )
  );

CREATE POLICY "Users can delete parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.statutory_parameters sp
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE sp.id = parameter_notes.parameter_id 
      AND sp.dairy_unit_id = p.dairy_unit_id
      AND p.dairy_unit_id IS NOT NULL
    )
  ); 