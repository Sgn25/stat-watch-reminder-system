import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Clock } from 'lucide-react';
import { StatutoryParameter } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { EditParameterForm } from '@/components/EditParameterForm';
import { formatDate } from '@/lib/dateUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ParameterCardProps {
  parameter: StatutoryParameter;
}

// Utility for display
function toDisplayDate(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function getStatusAndBadge(daysUntilExpiry: number): {
  label: string;
  color: string;
  icon: JSX.Element;
  animate: string;
} {
  if (daysUntilExpiry < 0) {
    return {
      label: 'Expired',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <XCircle className="w-5 h-5 animate-bounce" />,
      animate: 'animate-bounce',
    };
  } else if (daysUntilExpiry === 0) {
    return {
      label: 'Due Today',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: <Clock className="w-5 h-5 animate-pulse" />,
      animate: 'animate-pulse',
    };
  } else if (daysUntilExpiry <= 10) {
    return {
      label: 'Warning',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <AlertTriangle className="w-5 h-5 animate-pulse" />,
      animate: 'animate-pulse',
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      label: 'Warning',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 animate-pulse" />,
      animate: 'animate-pulse',
    };
  } else {
    return {
      label: 'Valid',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: <CheckCircle className="w-5 h-5 animate-pulse" />,
      animate: 'animate-pulse',
    };
  }
}

function getDaysRemainingText(daysUntilExpiry: number): { text: string; color: string } {
  if (daysUntilExpiry < 0) {
    return { text: `Expired ${Math.abs(daysUntilExpiry)} days ago`, color: 'text-red-600' };
  } else if (daysUntilExpiry === 0) {
    return { text: 'Due today', color: 'text-blue-600' };
  } else if (daysUntilExpiry <= 10) {
    return { text: `${daysUntilExpiry} days remaining`, color: 'text-red-600' };
  } else if (daysUntilExpiry <= 30) {
    return { text: `${daysUntilExpiry} days remaining`, color: 'text-amber-600' };
  } else {
    return { text: `${daysUntilExpiry} days remaining`, color: 'text-green-600' };
  }
}

export const ParameterCard = ({ parameter }: ParameterCardProps) => {
  const { deleteParameter, isDeletingParameter } = useStatutoryParameters();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const badge = getStatusAndBadge(parameter.daysUntilExpiry);
  const daysText = getDaysRemainingText(parameter.daysUntilExpiry);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this parameter?')) {
      deleteParameter(parameter.id);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02] relative flex flex-col min-h-[260px]">
        {/* Top-right badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color} ${badge.animate} shadow-sm`}> 
            {badge.icon}
            {badge.label}
          </span>
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{parameter.name}</h3>
            <p className="text-sm text-gray-600">{parameter.category}</p>
          </div>
        </div>

        {parameter.description && (
          <p className="text-sm text-gray-600 mb-4">{parameter.description}</p>
        )}

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Issued: {toDisplayDate(parameter.issue_date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Expires: {toDisplayDate(parameter.expiry_date)}</span>
          </div>
        </div>

        {/* Days remaining at bottom */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className={`text-sm font-semibold ${daysText.color}`}>{daysText.text}</span>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-800 focus:ring-2 focus:ring-blue-300"
                    onClick={() => setIsEditDialogOpen(true)}
                    aria-label="Edit Parameter"
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-800 focus:ring-2 focus:ring-red-300"
                    onClick={handleDelete}
                    disabled={isDeletingParameter}
                    aria-label="Delete Parameter"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parameter</DialogTitle>
          </DialogHeader>
          <EditParameterForm parameter={parameter} onClose={() => setIsEditDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};