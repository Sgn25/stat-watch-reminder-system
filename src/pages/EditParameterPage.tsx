import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EditParameterForm } from '@/components/EditParameterForm';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const EditParameterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { parameters, isLoading } = useStatutoryParameters();
  const parameter = parameters.find(p => p.id === id);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-300">Loading parameter...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!parameter) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64">
            <span className="text-red-400">Parameter not found.</span>
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
            <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Edit Parameter</h1>
          </div>
          <EditParameterForm parameter={parameter} onClose={() => navigate(`/parameters/${parameter.id}`)} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default EditParameterPage; 