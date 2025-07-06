-- Fix the parameter history trigger function to work correctly
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS parameter_changes_trigger ON public.statutory_parameters;
DROP FUNCTION IF EXISTS public.log_parameter_changes();

-- Recreate the function with better error handling
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

-- Recreate the trigger
CREATE TRIGGER parameter_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.statutory_parameters
  FOR EACH ROW EXECUTE PROCEDURE public.log_parameter_changes();

-- Ensure the trigger is enabled
ALTER TABLE public.statutory_parameters ENABLE TRIGGER parameter_changes_trigger; 