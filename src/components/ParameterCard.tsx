import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { StatutoryParameter } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { EditParameterForm } from '@/components/EditParameterForm';
import { formatDate } from '@/lib/dateUtils';

interface ParameterCardProps {
  parameter: StatutoryParameter;
}

// Utility for display
function toDisplayDate(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export const ParameterCard = ({ parameter }: ParameterCardProps) => {
  const { deleteParameter, isDeletingParameter } = useStatutoryParameters();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'expired': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'expired': return <XCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStatusText = (status: string, daysUntilExpiry: number) => {
    switch (status) {
      case 'valid': return `${daysUntilExpiry} days remaining`;
      case 'warning': return `Expires in ${daysUntilExpiry} days`;
      case 'expired': return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
      default: return 'Unknown status';
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this parameter?')) {
      deleteParameter(parameter.id);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{parameter.name}</h3>
            <p className="text-sm text-gray-600">{parameter.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(parameter.status)}`}>
              {getStatusIcon(parameter.status)}
              {parameter.status.charAt(0).toUpperCase() + parameter.status.slice(1)}
            </span>
          </div>
        </div>

        {parameter.description && (
          <p className="text-sm text-gray-600 mb-4">{parameter.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Issued: {toDisplayDate(parameter.issue_date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Expires: {toDisplayDate(parameter.expiry_date)}</span>
          </div>
        </div>

        <div className={`