
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DairyUnit {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useDairyUnits = () => {
  const { data: dairyUnits = [], isLoading, error } = useQuery({
    queryKey: ['dairy-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dairy_units')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as DairyUnit[];
    },
  });

  return {
    dairyUnits,
    isLoading,
    error,
  };
};
