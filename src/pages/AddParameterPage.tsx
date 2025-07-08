import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AddParameterForm } from '@/components/AddParameterForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AddParameterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-8 text-white w-full px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Add New Parameter</h1>
          </div>
          <AddParameterForm onClose={() => navigate('/parameters')} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AddParameterPage; 