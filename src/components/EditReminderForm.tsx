import React, { useState, useEffect } from 'react';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EditReminderFormProps {
  reminder: any;
  onClose: () => void;
}

// Utility for display
function toDisplayDate(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export const EditReminderForm = ({ reminder, onClose }: EditReminderFormProps) => {
  const { parameters } = useStatutoryParameters();
  const { updateReminder, isUpdatingReminder } = useReminders();
  const [formData, setFormData] = useState({
    parameter_id: '',
    reminder_date: '',
    reminder_time: '',
    custom_message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (reminder) {
      setFormData({
        parameter_id: reminder.parameter_id || '',
        reminder_date: reminder.reminder_date || '',
        reminder_time: reminder.reminder_time || '',
        custom_message: reminder.custom_message || '',
      });
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!formData.parameter_id) {
      setError('Please select a parameter.');
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        updateReminder(
          { id: reminder.id, ...formData },
          {
            onSuccess: () => {
              setSuccess(true);
              resolve();
              setTimeout(onClose, 500); // Close after short delay
            },
            onError: (err: any) => {
              setError(err?.message || 'Failed to update reminder');
              reject(err);
            },
          }
        );
      });
    } catch {}
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="parameter" className="text-gray-300">Parameter</Label>
        <Select value={formData.parameter_id} onValueChange={(value) => handleChange('parameter_id', value)}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Select parameter" />
          </SelectTrigger>
          <SelectContent>
            {parameters.map((param) => (
              <SelectItem key={param.id} value={param.id}>
                {param.name} - {param.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reminder_date" className="text-gray-300">Reminder Date</Label>
          <Input
            id="reminder_date"
            type="date"
            value={formData.reminder_date}
            onChange={(e) => handleChange('reminder_date', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
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
            className="bg-gray-700 border-gray-600 text-white"
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
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUpdatingReminder}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isUpdatingReminder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Reminder
        </Button>
      </div>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      {success && <div className="text-green-500 text-sm mt-2">Reminder updated!</div>}
    </form>
  );
};
