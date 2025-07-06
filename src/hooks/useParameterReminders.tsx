import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface ParameterReminder {
  id: string;
  parameter_id: string;
  user_id: string;
  dairy_unit_id: string | null;
  reminder_date: string;
  reminder_time: string;
  custom_message: string | null;
  is_sent: boolean;
  created_at: string;
  updated_at: string;
}

export const useParameterReminders = (parameterId: string) => {
  const { profile } = useUserProfile();

  const { data: reminders = [], isLoading, error } = useQuery({
    queryKey: ['parameter-reminders', parameterId, profile?.dairy_unit_id],
    queryFn: async () => {
      if (!profile?.dairy_unit_id || !parameterId) return [];

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('parameter_id', parameterId)
        .eq('dairy_unit_id', profile.dairy_unit_id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.dairy_unit_id && !!parameterId,
  });

  return {
    reminders,
    isLoading,
    error,
  };
}; 