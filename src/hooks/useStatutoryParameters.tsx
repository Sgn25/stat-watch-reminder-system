
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StatutoryParameter {
  id: string;
  name: string;
  category: string;
  description?: string;
  issue_date: string;
  expiry_date: string;
  user_id: string;
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

export const useStatutoryParameters = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch parameters
  const { data: parameters = [], isLoading, error } = useQuery({
    queryKey: ['statutory-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statutory_parameters')
        .select('*')
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
  });

  // Add parameter mutation
  const addParameterMutation = useMutation({
    mutationFn: async (newParam: Omit<StatutoryParameter, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'daysUntilExpiry'>) => {
      const { data, error } = await supabase
        .from('statutory_parameters')
        .insert({
          name: newParam.name,
          category: newParam.category,
          description: newParam.description,
          issue_date: newParam.issue_date,
          expiry_date: newParam.expiry_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
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
      const { data, error } = await supabase
        .from('statutory_parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
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
      const { error } = await supabase
        .from('statutory_parameters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
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
    const channel = supabase
      .channel('statutory-parameters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'statutory_parameters',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['statutory-parameters'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
