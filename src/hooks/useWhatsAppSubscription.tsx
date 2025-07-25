import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface WhatsAppSubscription {
  id: string;
  user_id: string;
  dairy_unit_id: string;
  whatsapp_number: string;
  is_subscribed: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  // Fetch user's WhatsApp subscription
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['whatsapp-subscription', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('whatsapp_subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('dairy_unit_id', profile.dairy_unit_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data;
    },
    enabled: !!profile?.id && !!profile?.dairy_unit_id,
  });

  // Unsubscribe from WhatsApp
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !profile?.dairy_unit_id) {
        throw new Error('User profile not found');
      }

      const { data, error } = await supabase
        .from('whatsapp_subscriptions')
        .upsert({
          user_id: profile.id,
          dairy_unit_id: profile.dairy_unit_id,
          whatsapp_number: profile.whatsapp_number || '',
          is_subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        }, { onConflict: ['user_id', 'dairy_unit_id'] })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscription'] });
      toast({
        title: "Success",
        description: "You have been unsubscribed from WhatsApp reminders",
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

  // Subscribe to WhatsApp
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !profile?.dairy_unit_id) {
        throw new Error('User profile not found');
      }

      if (!profile.whatsapp_number) {
        throw new Error('WhatsApp number is required to subscribe');
      }

      const { data, error } = await supabase
        .from('whatsapp_subscriptions')
        .upsert({
          user_id: profile.id,
          dairy_unit_id: profile.dairy_unit_id,
          whatsapp_number: profile.whatsapp_number,
          is_subscribed: true,
          unsubscribed_at: null,
        }, { onConflict: ['user_id', 'dairy_unit_id'] })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-subscription'] });
      toast({
        title: "Success",
        description: "You have been subscribed to WhatsApp reminders",
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
    subscription,
    isLoading,
    error,
    isSubscribed: subscription?.is_subscribed ?? false, // Default to false if no subscription found
    unsubscribe: unsubscribeMutation.mutate,
    subscribe: subscribeMutation.mutate,
    isUnsubscribing: unsubscribeMutation.isPending,
    isSubscribing: subscribeMutation.isPending,
  };
}; 