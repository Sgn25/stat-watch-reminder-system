import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ParameterHistory {
  id: string;
  parameter_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted';
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user_name?: string;
}

export interface ParameterNote {
  id: string;
  parameter_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export const useParameterHistory = (parameterId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch parameter history
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['parameter-history', parameterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameter_history')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('parameter_id', parameterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((item): ParameterHistory => ({
        ...item,
        user_name: item.profiles?.full_name || 'Unknown User'
      }));
    },
    enabled: !!parameterId,
  });

  // Fetch parameter notes
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['parameter-notes', parameterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameter_notes')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('parameter_id', parameterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((item): ParameterNote => ({
        ...item,
        user_name: item.profiles?.full_name || 'Unknown User'
      }));
    },
    enabled: !!parameterId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('parameter_notes')
        .insert({
          parameter_id: parameterId,
          user_id: user.id,
          note_text: noteText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-notes', parameterId] });
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error: any) => {
      console.error('Failed to add note:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to add note',
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, noteText }: { id: string; noteText: string }) => {
      const { data, error } = await supabase
        .from('parameter_notes')
        .update({ note_text: noteText, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-notes', parameterId] });
      toast({
        title: "Success",
        description: "Note updated successfully",
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

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parameter_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-notes', parameterId] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
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
    history,
    notes,
    isLoadingHistory,
    isLoadingNotes,
    addNote: (noteText: string) => addNoteMutation.mutate(noteText),
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    isAddingNote: addNoteMutation.isPending,
    isUpdatingNote: updateNoteMutation.isPending,
    isDeletingNote: deleteNoteMutation.isPending,
  };
};
