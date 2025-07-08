import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AddReminderForm } from '@/components/AddReminderForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AddReminderPage: React.FC = () => {
  const { parameterId } = useParams<{ parameterId?: string }>();
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-8 text-white w-full px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Set New Reminder</h1>
          </div>
          <AddReminderForm parameterId={parameterId} onClose={() => navigate('/reminders')} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AddReminderPage; 