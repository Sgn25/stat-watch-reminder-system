import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EditReminderForm } from '@/components/EditReminderForm';
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const EditReminderPage: React.FC = () => {
  const { reminderId } = useParams<{ reminderId: string }>();
  const navigate = useNavigate();
  const { reminders, isLoading } = useReminders();
  const reminder = reminders.find(r => r.id === reminderId);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-300">Loading reminder...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!reminder) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64">
            <span className="text-red-400">Reminder not found.</span>
            <Button className="mt-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-8 text-white w-full px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Edit Reminder</h1>
          </div>
          <EditReminderForm reminder={reminder} onClose={() => navigate('/reminders')} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default EditReminderPage; 