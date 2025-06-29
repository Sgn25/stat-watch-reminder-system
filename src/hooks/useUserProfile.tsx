
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  full_name?: string;
  dairy_unit_id?: string;
  created_at: string;
  updated_at: string;
  dairy_unit?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
}

export const useUserProfile = () => {
  const { user } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          dairy_unit:dairy_units(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });

  return {
    profile,
    isLoading,
    error,
  };
};
