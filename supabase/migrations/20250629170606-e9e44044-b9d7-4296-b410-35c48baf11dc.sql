
-- Create dairy_units table
CREATE TABLE public.dairy_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the dairy units
INSERT INTO public.dairy_units (name, code, description) VALUES
('Wayanad Dairy', 'WYD', 'Wayanad Dairy Unit'),
('Malappuram Dairy', 'MLP', 'Malappuram Dairy Unit'),
('Kannur Dairy', 'KNR', 'Kannur Dairy Unit'),
('Kozhikode Dairy', 'KZD', 'Kozhikode Dairy Unit'),
('Palakkad Dairy', 'PKD', 'Palakkad Dairy Unit'),
('Kasaragod Dairy', 'KSD', 'Kasaragod Dairy Unit');

-- Add dairy_unit_id to profiles table
ALTER TABLE public.profiles ADD COLUMN dairy_unit_id UUID REFERENCES public.dairy_units(id);

-- Add dairy_unit_id to statutory_parameters table
ALTER TABLE public.statutory_parameters ADD COLUMN dairy_unit_id UUID REFERENCES public.dairy_units(id);

-- Update the handle_new_user function to handle dairy unit assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, dairy_unit_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    (new.raw_user_meta_data ->> 'dairy_unit_id')::uuid
  );
  
  INSERT INTO public.reminder_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Update RLS policies for statutory_parameters to include dairy unit filtering
DROP POLICY IF EXISTS "Users can view their own parameters" ON public.statutory_parameters;
DROP POLICY IF EXISTS "Users can create their own parameters" ON public.statutory_parameters;
DROP POLICY IF EXISTS "Users can update their own parameters" ON public.statutory_parameters;
DROP POLICY IF EXISTS "Users can delete their own parameters" ON public.statutory_parameters;

-- Create new policies that consider both user and dairy unit
CREATE POLICY "Users can view their dairy unit parameters" 
  ON public.statutory_parameters 
  FOR SELECT 
  USING (
    auth.uid() = user_id AND 
    dairy_unit_id = (SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create their dairy unit parameters" 
  ON public.statutory_parameters 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    dairy_unit_id = (SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their dairy unit parameters" 
  ON public.statutory_parameters 
  FOR UPDATE 
  USING (
    auth.uid() = user_id AND 
    dairy_unit_id = (SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their dairy unit parameters" 
  ON public.statutory_parameters 
  FOR DELETE 
  USING (
    auth.uid() = user_id AND 
    dairy_unit_id = (SELECT dairy_unit_id FROM public.profiles WHERE id = auth.uid())
  );

-- Enable RLS on dairy_units table (make it readable by all authenticated users)
ALTER TABLE public.dairy_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dairy units" 
  ON public.dairy_units 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Enable realtime for dairy_units table
ALTER TABLE public.dairy_units REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dairy_units;

-- FIX: Update handle_new_user to use raw_user_meta_data for dairy_unit_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, dairy_unit_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    (new.raw_user_meta_data ->> 'dairy_unit_id')::uuid
  );
  
  INSERT INTO public.reminder_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;
