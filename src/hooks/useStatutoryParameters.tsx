
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface StatutoryParameter {
  id: string;
  name: string;
  category: string;
  description?: string;
  issue_date: string;
  expiry_date: string;
  user_id: string;
  dairy_unit_id?: string;
  created_at: string;
  updated_at: string;
  status: 'valid' | 'warning' | 'expired';
  daysUntilExpiry: number;
}

const calculateStatus = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: 'valid' | 'warning' | 'expired' = 'valid';
  if (daysUntilExpiry < 0) status = 'expired';
  else if (daysUntilExpiry <= 30) status = 'warning';

  return { status, daysUntilExpiry };
};

// Helper to log parameter history with better error handling
async function logParameterHistory({ parameterId, userId, action, fieldName, oldValue, newValue }: {
  parameterId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    console.log('Logging parameter history:', { parameterId, userId, action, fieldName });
    
    const { data, error } = await supabase.from('parameter_history').insert({
      parameter_id: parameterId,
      user_id: userId,
      action,
      field_name: fieldName || null,
      old_value: oldValue || null,
      new_value: newValue || null,
    });

    if (error) {
      console.error('Failed to log parameter history:', error);
      throw error;
    }

    console.log('Parameter history logged successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in logParameterHistory:', error);
    // Don't throw the error to prevent breaking the main operation
    return null;
  }
}

export const useStatutoryParameters = (options?: { refetchHistory?: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  // Fetch parameters for the user's dairy unit
  const { data: parameters = [], isLoading, error } = useQuery({
    queryKey: ['statutory-parameters', profile?.dairy_unit_id],
    queryFn: async () => {
      if (!profile?.dairy_unit_id) return [];

      const { data, error } = await supabase
        .from('statutory_parameters')
        .select('*')
        .eq('dairy_unit_id', profile.dairy_unit_id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      return data.map((param): StatutoryParameter => {
        const { status, daysUntilExpiry } = calculateStatus(param.expiry_date);
        return {
          ...param,
          status,
          daysUntilExpiry,
        };
      });
    },
    enabled: !!profile?.dairy_unit_id,
  });

  // Add parameter mutation
  const addParameterMutation = useMutation({
    mutationFn: async (newParam: Omit<StatutoryParameter, 'id' | 'user_id' | 'dairy_unit_id' | 'created_at' | 'updated_at' | 'status' | 'daysUntilExpiry'>) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      if (!profile?.dairy_unit_id) throw new Error('No dairy unit assigned');

      const { data, error } = await supabase
        .from('statutory_parameters')
        .insert({
          name: newParam.name,
          category: newParam.category,
          description: newParam.description,
          issue_date: newParam.issue_date,
          expiry_date: newParam.expiry_date,
          user_id: user.id,
          dairy_unit_id: profile.dairy_unit_id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log creation in history (non-blocking)
      await logParameterHistory({ parameterId: data.id, userId: user.id, action: 'created' });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-history'] });
      if (options?.refetchHistory) options.refetchHistory();
      toast({
        title: "Success",
        description: "Parameter added successfully",
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

  // Update parameter mutation
  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StatutoryParameter> & { id: string }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Fetch old parameter for diff
      const { data: oldParam } = await supabase.from('statutory_parameters').select('*').eq('id', id).single();
      
      const { data, error } = await supabase
        .from('statutory_parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Log each changed field (non-blocking)
      if (oldParam) {
        for (const key of Object.keys(updates)) {
          if (updates[key as keyof typeof updates] !== oldParam[key]) {
            await logParameterHistory({
              parameterId: id,
              userId: user.id,
              action: 'updated',
              fieldName: key,
              oldValue: oldParam[key]?.toString(),
              newValue: updates[key as keyof typeof updates]?.toString(),
            });
          }
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-history'] });
      if (options?.refetchHistory) options.refetchHistory();
      toast({
        title: "Success",
        description: "Parameter updated successfully",
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

  // Delete parameter mutation
  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Log deletion in history before deleting (non-blocking)
      await logParameterHistory({ parameterId: id, userId: user.id, action: 'deleted' });
      
      const { error } = await supabase
        .from('statutory_parameters')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-history'] });
      if (options?.refetchHistory) options.refetchHistory();
      toast({
        title: "Success",
        description: "Parameter deleted successfully",
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

  // Real-time subscription
  useEffect(() => {
    if (!profile?.dairy_unit_id) return;

    const channel = supabase
      .channel('statutory-parameters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'statutory_parameters',
          filter: `dairy_unit_id=eq.${profile.dairy_unit_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, profile?.dairy_unit_id]);

  return {
    parameters,
    isLoading,
    error,
    addParameter: addParameterMutation.mutate,
    updateParameter: updateParameterMutation.mutate,
    deleteParameter: deleteParameterMutation.mutate,
    isAddingParameter: addParameterMutation.isPending,
    isUpdatingParameter: updateParameterMutation.isPending,
    isDeletingParameter: deleteParameterMutation.isPending,
  };
};
