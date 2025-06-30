
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, Mail, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Reminders = () => {
  const { parameters } = useStatutoryParameters();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [reminders, setReminders] = useState([]);

  const handleAddReminder = () => {
    if (!selectedParameter || !reminderTime) {
      toast({
        title: "Error",
        description: "Please select a parameter and time",
        variant: "destructive",
      });
      return;
    }

    const parameter = parameters.find(p => p.id === selectedParameter);
    const newReminder = {
      id: Date.now().toString(),
      parameter: parameter,
      time: reminderTime,
      message: customMessage,
      created_at: new Date().toISOString(),
    };

    setReminders([...reminders, newReminder]);
    setIsAddDialogOpen(false);
    setSelectedParameter('');
    setReminderTime('');
    setCustomMessage('');

    toast({
      title: "Success",
      description: "Reminder set successfully",
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Reminders</h1>
              <p className="text-gray-400 mt-1">Set email notifications for parameter expiration</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Set New Reminder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="parameter" className="text-gray-300">Parameter</Label>
                    <Select value={selectedParameter} onValueChange={setSelectedParameter}>
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
                  <div>
                    <Label htmlFor="time" className="text-gray-300">Reminder Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-gray-300">Custom Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Add a custom message for the reminder..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddReminder} className="bg-blue-600 hover:bg-blue-700">
                      Set Reminder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No reminders set</h3>
              <p className="text-gray-400">Add your first reminder to get email notifications</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-400" />
                      {reminder.parameter.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {reminder.parameter.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Time: {reminder.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">Email notification enabled</span>
                      </div>
                    </div>
                    {reminder.message && (
                      <div className="mt-3 p-3 bg-gray-700 rounded-md">
                        <p className="text-sm text-gray-300">{reminder.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Reminders;
