import React, { useState } from 'react';
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { StatutoryParameter } from '@/hooks/useStatutoryParameters';

interface AddParameterReminderFormProps {
  parameter: StatutoryParameter;
  onClose: () => void;
}

export const AddParameterReminderForm = ({ parameter, onClose }: AddParameterReminderFormProps) => {
  const { addReminder, isAddingReminder } = useReminders();
  const [formData, setFormData] = useState({
    parameter_id: parameter.id,
    reminder_date: '',
    reminder_time: '',
    custom_message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReminder(formData);
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-300">Parameter</Label>
        <div className="bg-gray-700/50 border border-gray-600/50 rounded-md px-3 py-2 text-white backdrop-blur-sm">
          {parameter.name} - {parameter.category}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reminder_date" className="text-gray-300">Reminder Date</Label>
          <Input
            id="reminder_date"
            type="date"
            value={formData.reminder_date}
            onChange={(e) => handleChange('reminder_date', e.target.value)}
            className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="reminder_time" className="text-gray-300">Reminder Time</Label>
          <Input
            id="reminder_time"
            type="time"
            value={formData.reminder_time}
            onChange={(e) => handleChange('reminder_time', e.target.value)}
            className="bg-gray-700/50 border-gray-600/50 text-white backdrop-blur-sm"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="custom_message" className="text-gray-300">Custom Message (Optional)</Label>
        <Textarea
          id="custom_message"
          placeholder="Add a custom message for the reminder..."
          value={formData.custom_message}
          onChange={(e) => handleChange('custom_message', e.target.value)}
          className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-sm"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 backdrop-blur-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isAddingReminder}
          className="bg-blue-600 hover:bg-blue-700 backdrop-blur-sm"
        >
          {isAddingReminder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Reminder
        </Button>
      </div>
    </form>
  );
}; 