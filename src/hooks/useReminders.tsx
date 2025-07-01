
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface Reminder {
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

export const useReminders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  // Fetch reminders for the user's dairy unit
  const { data: reminders = [], isLoading, error } = useQuery({
    queryKey: ['reminders', profile?.dairy_unit_id],
    queryFn: async () => {
      if (!profile?.dairy_unit_id) return [];

      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          statutory_parameters (
            id,
            name,
            category,
            expiry_date
          )
        `)
        .eq('dairy_unit_id', profile.dairy_unit_id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.dairy_unit_id,
  });

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: async (newReminder: {
      parameter_id: string;
      reminder_date: string;
      reminder_time: string;
      custom_message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      if (!profile?.dairy_unit_id) throw new Error('No dairy unit assigned');

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          parameter_id: newReminder.parameter_id,
          user_id: user.id,
          dairy_unit_id: profile.dairy_unit_id,
          reminder_date: newReminder.reminder_date,
          reminder_time: newReminder.reminder_time,
          custom_message: newReminder.custom_message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast({
        title: "Success",
        description: "Reminder added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    reminders,
    isLoading,
    error,
    addReminder: addReminderMutation.mutate,
    deleteReminder: deleteReminderMutation.mutate,
    isAddingReminder: addReminderMutation.isPending,
    isDeletingReminder: deleteReminderMutation.isPending,
  };
};
