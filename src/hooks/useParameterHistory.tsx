
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Database } from '@/integrations/supabase/types';

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

  // Fetch parameter update history
  const { data: history = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['parameter-history', parameterId],
    queryFn: async () => {
      console.log('Fetching parameter history for:', parameterId);
      
      const { data: rawHistory, error: rawError } = await supabase
        .from<'parameter_history_detailed_view', Database['public']['Views']['parameter_history_detailed_view']['Row']>('parameter_history_detailed_view')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('created_at', { ascending: false });
      
      if (rawError) {
        console.error('Error fetching parameter history:', rawError);
        throw rawError;
      }
      
      console.log('Raw parameter history data:', rawHistory);
      
      if (!rawHistory || rawHistory.length === 0) {
        console.log('No parameter history found for:', parameterId);
        return [];
      }
      
      // Get unique user IDs
      const userIds = [...new Set(rawHistory.map(h => h.user_id))];
      
      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (profileError) {
        console.warn('Error fetching user profiles for history:', profileError);
      }
      
      const userNameMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile.full_name || 'Unknown User';
        return acc;
      }, {} as Record<string, string>);
      
      // Map history with user names
      const historyWithUserNames = rawHistory.map((h: any) => ({ 
        ...h, 
        user_name: userNameMap[h.user_id] || 'Unknown User' 
      }));
      
      console.log('Parameter history fetched successfully:', historyWithUserNames);
      return historyWithUserNames;
    },
    enabled: !!parameterId,
    refetchInterval: 5000, // Refetch every 5 seconds to catch real-time updates
  });

  // Fetch parameter notes with proper user name resolution
  const { data: notes = [], isLoading: isLoadingNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['parameter-notes', parameterId],
    queryFn: async () => {
      console.log('Fetching parameter notes for:', parameterId);
      
      // First, get the notes
      const { data: rawNotes, error: rawError } = await supabase
        .from('parameter_notes')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('created_at', { ascending: false });
      
      if (rawError) {
        console.error('Error fetching parameter notes:', rawError);
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
      
      if (profileError) {
        console.warn('Error fetching user profiles for notes:', profileError);
      }
      
      // Create a map of user ID to full name
      const userNameMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile.full_name || 'Unknown User';
        return acc;
      }, {} as Record<string, string>);
      
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
      
      console.log('Parameter notes fetched successfully:', notesWithUserNames);
      return notesWithUserNames;
    },
    enabled: !!parameterId,
  });

  // Real-time subscription for parameter history and notes
  useEffect(() => {
    if (!parameterId) return;

    console.log('Setting up real-time subscriptions for parameter:', parameterId);

    const channel = supabase
      .channel(`parameter-realtime-${parameterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parameter_history',
          filter: `parameter_id=eq.${parameterId}`,
        },
        (payload) => {
          console.log('Parameter history real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['parameter-history', parameterId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parameter_notes',
          filter: `parameter_id=eq.${parameterId}`,
        },
        (payload) => {
          console.log('Parameter notes real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['parameter-notes', parameterId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions for parameter:', parameterId);
      supabase.removeChannel(channel);
    };
  }, [parameterId, queryClient]);

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Adding note for parameter:', parameterId, 'by user:', user.id);

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
      console.log('Note add success - invalidating queries');
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

  // Add a helper to refetch all data
  const refetchAll = () => {
    refetchHistory();
    refetchNotes();
  };

  return {
    history,
    isLoadingHistory,
    notes,
    isLoadingNotes,
    addNote: addNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    isAddingNote: addNoteMutation.isPending,
    isUpdatingNote: updateNoteMutation.isPending,
    isDeletingNote: deleteNoteMutation.isPending,
    refetchAll,
  };
};
