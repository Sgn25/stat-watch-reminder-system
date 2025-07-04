
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

  // Since parameter_history table doesn't exist, return empty array for now
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['parameter-history', parameterId],
    queryFn: async () => {
      // Return empty array since parameter_history table doesn't exist
      return [];
    },
    enabled: !!parameterId,
  });

  // Fetch parameter notes with proper user name resolution
  const { data: notes = [], isLoading: isLoadingNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['parameter-notes', parameterId],
    queryFn: async () => {
      console.log('=== FETCHING NOTES DEBUG ===');
      console.log('Parameter ID:', parameterId);
      
      // First, get the notes
      const { data: rawNotes, error: rawError } = await supabase
        .from('parameter_notes')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('created_at', { ascending: false });
      
      console.log('Raw notes from DB:', rawNotes);
      console.log('Raw notes error:', rawError);
      
      if (rawError) {
        console.error('Error fetching raw notes:', rawError);
        throw rawError;
      }
      
      if (!rawNotes || rawNotes.length === 0) {
        console.log('No notes found for parameter:', parameterId);
        return [];
      }
      
      // Get unique user IDs from notes
      const userIds = [...new Set(rawNotes.map(note => note.user_id))];
      
      // Fetch user profiles for these IDs
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      console.log('Fetched profiles:', profiles);
      
      if (profileError) {
        console.warn('Error fetching profiles:', profileError);
      }
      
      // Create a map of user ID to full name
      const userNameMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile.full_name || 'Unknown User';
        return acc;
      }, {} as Record<string, string>);
      
      console.log('User name map:', userNameMap);
      
      // Map notes with user names
      const notesWithUserNames = rawNotes.map((note): ParameterNote => ({
        id: note.id,
        parameter_id: note.parameter_id,
        user_id: note.user_id,
        note_text: note.note_text,
        created_at: note.created_at,
        updated_at: note.updated_at,
        user_name: userNameMap[note.user_id] || 'Unknown User'
      }));
      
      console.log('Final notes with user names:', notesWithUserNames);
      return notesWithUserNames;
    },
    enabled: !!parameterId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('=== ADDING NOTE DEBUG ===');
      console.log('Adding note:', noteText, 'for parameter:', parameterId, 'by user:', user.id);

      const { data, error } = await supabase
        .from('parameter_notes')
        .insert({
          parameter_id: parameterId,
          user_id: user.id,
          note_text: noteText,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding note:', error);
        throw error;
      }

      console.log('Note added successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Note add success - invalidating queries and refetching');
      // Invalidate and refetch the notes
      queryClient.invalidateQueries({ queryKey: ['parameter-notes', parameterId] });
      // Force immediate refetch
      setTimeout(() => {
        refetchNotes();
      }, 100);
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
      setTimeout(() => {
        refetchNotes();
      }, 100);
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
      setTimeout(() => {
        refetchNotes();
      }, 100);
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
