import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Clock, Bell } from 'lucide-react';
import { StatutoryParameter } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { EditParameterForm } from '@/components/EditParameterForm';
import { formatDate } from '@/lib/dateUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { AddParameterReminderForm } from '@/components/AddParameterReminderForm';
import { useParameterReminders } from '@/hooks/useParameterReminders';

interface ParameterCardProps {
  parameter: StatutoryParameter;
  viewMode?: 'grid' | 'list';
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

export const ParameterCard = ({ parameter, viewMode = 'grid' }: ParameterCardProps) => {
  const { deleteParameter, isDeletingParameter } = useStatutoryParameters();
  const navigate = useNavigate();
  const { reminders, isLoading: isLoadingReminders } = useParameterReminders(parameter.id);

  const badge = getStatusAndBadge(parameter.daysUntilExpiry);
  const daysText = getDaysRemainingText(parameter.daysUntilExpiry);

  // Get upcoming reminders (not sent yet)
  const upcomingReminders = reminders.filter(reminder => !reminder.is_sent);
  const nextReminder = upcomingReminders[0]; // First upcoming reminder

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this parameter?')) {
      deleteParameter(parameter.id);
    }
  };

  return (
    <>
      {viewMode === 'grid' ? (
        <div
          className="glass-card rounded-lg p-6 relative flex flex-col min-h-[260px] cursor-pointer group"
          onClick={() => navigate(`/parameters/${parameter.id}`)}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${parameter.name}`}
        >
          {/* Top-right badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.animate} ${
              parameter.daysUntilExpiry < 0 ? 'badge-glow-expired' :
              parameter.daysUntilExpiry === 0 ? 'badge-glow-due' :
              parameter.daysUntilExpiry <= 10 ? 'badge-glow-expired' :
              parameter.daysUntilExpiry <= 30 ? 'badge-glow-warning' :
              'badge-glow-valid'
            }`}> 
              {badge.icon}
              {badge.label}
            </span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                {parameter.name}
              </h3>
              <p className="text-sm text-gray-300">{parameter.category}</p>
            </div>
          </div>
          {parameter.description && (
            <p className="text-sm text-gray-300 mb-4">{parameter.description}</p>
          )}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Issued: {toDisplayDate(parameter.issue_date)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Expires: {toDisplayDate(parameter.expiry_date)}</span>
            </div>
          </div>
          
          {/* Reminder Information */}
          {isLoadingReminders ? (
            <div className="mb-4 glass-reminder-empty rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                <span className="text-sm text-gray-300">Loading reminders...</span>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              {upcomingReminders.length > 0 ? (
                <div className="glass-reminder rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-300">
                      {upcomingReminders.length} Reminder{upcomingReminders.length > 1 ? 's' : ''} Set
                    </span>
                  </div>
                  {nextReminder && (
                    <div className="text-xs text-green-200">
                      Next: {toDisplayDate(nextReminder.reminder_date)} at {nextReminder.reminder_time}
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="glass-reminder-empty rounded-lg p-3 cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/parameters/${parameter.id}/reminders/add`);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">No reminders set</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Days remaining at bottom */}
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className={`text-sm font-semibold ${daysText.color.replace('text-red-600', 'text-red-400').replace('text-amber-600', 'text-yellow-400').replace('text-green-600', 'text-green-400').replace('text-blue-600', 'text-blue-400')}`}>{daysText.text}</span>
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 focus:ring-2 focus:ring-blue-400/50"
                      onClick={() => navigate(`/parameters/${parameter.id}/edit`)}
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
                      className="text-red-400 hover:bg-red-900/50 hover:text-red-300 focus:ring-2 focus:ring-red-400/50"
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
      ) : (
        <div
          className="flex items-center px-6 py-4 glass-row hover:border-blue-500 transition-colors cursor-pointer group rounded-md"
          onClick={() => navigate(`/parameters/${parameter.id}`)}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${parameter.name}`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.animate} ${
                parameter.daysUntilExpiry < 0 ? 'badge-glow-expired' :
                parameter.daysUntilExpiry === 0 ? 'badge-glow-due' :
                parameter.daysUntilExpiry <= 10 ? 'badge-glow-expired' :
                parameter.daysUntilExpiry <= 30 ? 'badge-glow-warning' :
                'badge-glow-valid'
              }`}> 
                {badge.icon}
                {badge.label}
              </span>
              <span className="text-lg font-bold text-blue-300 group-hover:text-blue-400 transition-colors">{parameter.name}</span>
              <span className="text-sm text-gray-300">{parameter.category}</span>
            </div>
            <div className="flex gap-6 mt-2 text-sm text-gray-300">
              <span>Issued: <span className="text-white font-medium">{toDisplayDate(parameter.issue_date)}</span></span>
              <span>Expires: <span className="text-white font-medium">{toDisplayDate(parameter.expiry_date)}</span></span>
              <span className={daysText.color.replace('text-red-600', 'text-red-400').replace('text-amber-600', 'text-yellow-400').replace('text-green-600', 'text-green-400').replace('text-blue-600', 'text-blue-400') + ' font-semibold'}>{daysText.text}</span>
            </div>
            {parameter.description && (
              <div className="text-xs text-gray-400 mt-1">{parameter.description}</div>
            )}
            {/* Reminder Information for List View */}
            {isLoadingReminders ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 bg-gray-600 rounded animate-pulse"></div>
                <span className="text-xs text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <Bell className="w-3 h-3 text-gray-400" />
                {upcomingReminders.length > 0 ? (
                  <span className="text-xs text-green-400">
                    {upcomingReminders.length} reminder{upcomingReminders.length > 1 ? 's' : ''} • Next: {toDisplayDate(nextReminder?.reminder_date || '')}
                  </span>
                ) : (
                  <span 
                    className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/parameters/${parameter.id}/reminders/add`);
                    }}
                  >
                    No reminders
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 focus:ring-2 focus:ring-blue-400/50"
                    onClick={() => navigate(`/parameters/${parameter.id}/edit`)}
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
                    className="text-red-400 hover:bg-red-900/50 hover:text-red-300 focus:ring-2 focus:ring-red-400/50"
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
      )}
      
    </>
  );
};