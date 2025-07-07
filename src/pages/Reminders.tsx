
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddReminderForm } from '@/components/AddReminderForm';
import { ReminderCard } from '@/components/ReminderCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Reminders = () => {
  const { reminders, isLoading } = useReminders();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const { toast } = useToast();

  // Group reminders by parameter
  const remindersByParameter = reminders.reduce((acc: any, reminder: any) => {
    const parameterId = reminder.parameter_id;
    if (!acc[parameterId]) {
      acc[parameterId] = {
        parameter: reminder.statutory_parameters,
        reminders: []
      };
    }
    acc[parameterId].reminders.push(reminder);
    return acc;
  }, {});

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email-send');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Test Email Triggered",
        description: "Check the function logs for results and your email inbox",
      });
      
      console.log('Test email result:', data);
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
      console.error('Test email error:', error);
    } finally {
      setIsTestingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading reminders...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Reminders</h1>
              <p className="text-gray-400 mt-1">Set custom reminder notifications for parameter expiration</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                variant="outline"
                className="border-green-600/50 text-green-400 hover:bg-green-900/20 backdrop-blur-sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isTestingEmail ? 'Testing...' : 'Test Email'}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-white">Set New Reminder</DialogTitle>
                  </DialogHeader>
                  <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                    <AddReminderForm onClose={() => setIsAddDialogOpen(false)} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-lg border-0">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No reminders set</h3>
              <p className="text-gray-300">Add your first reminder to get email notifications</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(remindersByParameter).map((group: any) => (
                <div key={group.parameter?.id} className="space-y-4">
                  <div className="border-b border-gray-700/50 pb-2">
                    <h2 className="text-xl font-semibold text-white">{group.parameter?.name}</h2>
                    <p className="text-gray-300 text-sm">
                      {group.parameter?.category} - {group.reminders.length} reminder(s) set
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {group.reminders.map((reminder: any) => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Reminders;
