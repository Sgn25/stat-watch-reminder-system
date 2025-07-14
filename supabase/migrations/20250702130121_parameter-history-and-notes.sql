-- Create parameter_history table for tracking changes
CREATE TABLE IF NOT EXISTS public.parameter_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parameter_id UUID NOT NULL REFERENCES public.statutory_parameters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parameter_notes table for additional information
CREATE TABLE IF NOT EXISTS public.parameter_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parameter_id UUID NOT NULL REFERENCES public.statutory_parameters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.parameter_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameter_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for parameter_history
CREATE POLICY "Users can view parameter history for their dairy unit" 
  ON public.parameter_history 
  FOR SELECT 
  USING (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

CREATE POLICY "Users can insert parameter history for their dairy unit" 
  ON public.parameter_history 
  FOR INSERT 
  WITH CHECK (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

-- Create policies for parameter_notes
CREATE POLICY "Users can view parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR SELECT 
  USING (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

CREATE POLICY "Users can insert parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR INSERT 
  WITH CHECK (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

CREATE POLICY "Users can update parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR UPDATE 
  USING (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

CREATE POLICY "Users can delete parameter notes for their dairy unit" 
  ON public.parameter_notes 
  FOR DELETE 
  USING (parameter_id IN (
    SELECT sp.id FROM public.statutory_parameters sp
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sp.dairy_unit_id = p.dairy_unit_id
  ));

-- Create function to automatically log parameter changes
CREATE OR REPLACE FUNCTION public.log_parameter_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, new_value)
    VALUES (NEW.id, NEW.user_id, 'created', 'all', 'Parameter created');
    RETURN NEW;
  END IF;

  -- Log updates
  IF TG_OP = 'UPDATE' THEN
    -- Log name changes
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'updated', 'name', OLD.name, NEW.name);
    END IF;

    -- Log category changes
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'updated', 'category', OLD.category, NEW.category);
    END IF;

    -- Log description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'updated', 'description', OLD.description, NEW.description);
    END IF;

    -- Log issue_date changes
    IF OLD.issue_date IS DISTINCT FROM NEW.issue_date THEN
      INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'updated', 'issue_date', OLD.issue_date::text, NEW.issue_date::text);
    END IF;

    -- Log expiry_date changes
    IF OLD.expiry_date IS DISTINCT FROM NEW.expiry_date THEN
      INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'updated', 'expiry_date', OLD.expiry_date::text, NEW.expiry_date::text);
    END IF;

    RETURN NEW;
  END IF;

  -- Log deletion
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.parameter_history (parameter_id, user_id, action, field_name, old_value)
    VALUES (OLD.id, OLD.user_id, 'deleted', 'all', 'Parameter deleted');
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for parameter changes
CREATE TRIGGER parameter_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.statutory_parameters
  FOR EACH ROW EXECUTE PROCEDURE public.log_parameter_changes();

-- Enable realtime for new tables
ALTER TABLE public.parameter_history REPLICA IDENTITY FULL;
ALTER TABLE public.parameter_notes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parameter_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parameter_notes; 