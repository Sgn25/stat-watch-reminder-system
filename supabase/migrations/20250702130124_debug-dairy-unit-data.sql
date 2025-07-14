-- Debug function to check dairy unit data
CREATE OR REPLACE FUNCTION debug_dairy_unit_data(param_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_dairy_unit_id UUID,
  param_dairy_unit_id UUID,
  user_has_dairy_unit BOOLEAN,
  param_has_dairy_unit BOOLEAN,
  dairy_units_match BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.dairy_unit_id as user_dairy_unit_id,
    sp.dairy_unit_id as param_dairy_unit_id,
    (p.dairy_unit_id IS NOT NULL) as user_has_dairy_unit,
    (sp.dairy_unit_id IS NOT NULL) as param_has_dairy_unit,
    (p.dairy_unit_id = sp.dairy_unit_id) as dairy_units_match
  FROM public.profiles p
  CROSS JOIN public.statutory_parameters sp
  WHERE p.id = auth.uid()
  AND sp.id = param_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_dairy_unit_data(UUID) TO authenticated; 