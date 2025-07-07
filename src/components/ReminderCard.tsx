
import React, { useState } from 'react';
import { Bell, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReminders } from '@/hooks/useReminders';
import { EditReminderForm } from '@/components/EditReminderForm';
import { formatDate, formatTime } from '@/lib/dateUtils';

interface ReminderCardProps {
  reminder: any;
}

export const ReminderCard = ({ reminder }: ReminderCardProps) => {
  const { deleteReminder, isDeletingReminder } = useReminders();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      deleteReminder(reminder.id);
    }
  };

  const calculateDaysUntilReminder = () => {
    const reminderDateTime = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
    const now = new Date();
    const timeDiff = reminderDateTime.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const daysUntilReminder = calculateDaysUntilReminder();
  const isOverdue = daysUntilReminder < 0;
  const isToday = daysUntilReminder === 0;

  // Convert 24-hour time to 12-hour format
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className={`w-5 h-5 ${isOverdue ? 'text-red-400' : isToday ? 'text-yellow-400' : 'text-blue-400'}`} />
            {reminder.statutory_parameters?.name}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {reminder.statutory_parameters?.category} - Expires: {formatDate(reminder.statutory_parameters?.expiry_date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Date: {formatDate(reminder.reminder_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Time: {formatTimeDisplay(reminder.reminder_time)}</span>
              </div>
            </div>
            
            <div className={`text-sm px-3 py-2 rounded-md backdrop-filter backdrop-blur-sm ${
              isOverdue 
                ? 'glass-status-expired text-red-300' 
                : isToday 
                  ? 'glass-status-due text-yellow-300'
                  : 'glass-status-valid text-green-300'
            }`}>
              {isOverdue 
                ? `Overdue by ${Math.abs(daysUntilReminder)} days`
                : isToday 
                  ? 'Due today!'
                  : `Due in ${daysUntilReminder} days`
              }
            </div>

            {reminder.custom_message && (
              <div className="p-3 glass-reminder-empty rounded-md">
                <p className="text-sm text-gray-300">{reminder.custom_message}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="text-blue-400 border-blue-600/50 hover:bg-blue-900/20 backdrop-blur-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeletingReminder}
                className="text-red-400 border-red-600/50 hover:bg-red-900/20 backdrop-blur-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Reminder</DialogTitle>
          </DialogHeader>
          <EditReminderForm reminder={reminder} onClose={() => setIsEditDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
