import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Calendar, FileText, Building2, Clock, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParameterHistory } from '@/hooks/useParameterHistory';
import { useAuth } from '@/hooks/useAuth';
import { useDairyUnits } from '@/hooks/useDairyUnits';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { useParameterReminders } from '@/hooks/useParameterReminders';
import { toast } from 'sonner';

const ParameterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { parameters, isLoading: isLoadingParams } = useStatutoryParameters();
  const parameter = parameters.find(p => p.id === id);
  const { user } = useAuth();
  const { history, notes, addNote, isLoadingHistory, refetchAll } = useParameterHistory(id || '');
  const { dairyUnits, isLoading: isLoadingDairyUnits } = useDairyUnits();
  const { reminders = [], isLoading: isLoadingReminders } = useParameterReminders(parameter?.id);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  React.useEffect(() => {
    if (id) {
      refetchAll();
    }
  }, [id, refetchAll]);

  if (isLoadingParams) {
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

  const dairyUnitName = parameter.dairy_unit_id 
    ? dairyUnits.find(unit => unit.id === parameter.dairy_unit_id)?.name || 'Unknown Dairy Unit'
    : 'No Dairy Unit Assigned';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-600 text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      case 'expired':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    setIsAddingNote(true);
    try {
      await addNote(newNote.trim());
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center flex-1">{parameter.name}</h1>
            <Button 
              onClick={() => navigate(`/parameters/${parameter.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all duration-200 w-full sm:w-auto backdrop-blur-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Parameter
            </Button>
          </div>

          {/* Reminders Section */}
          <div className="mb-4">
            {isLoadingReminders ? (
              <div className="glass-reminder-empty rounded-lg p-3">
                <span className="text-sm text-gray-300">Loading reminders...</span>
              </div>
            ) : reminders.length > 0 ? (
              <div className="glass-reminder rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-green-300">
                    {reminders.length} Reminder{reminders.length > 1 ? 's' : ''} Set
                  </span>
                </div>
                {/* Optionally show next reminder info here */}
              </div>
            ) : (
              <div 
                className="glass-reminder-empty rounded-lg p-3 cursor-pointer transition-all duration-200 hover:bg-blue-900/20"
                onClick={() => navigate(`/parameters/${parameter.id}/reminders/add`)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">No reminders set (Click to add)</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-reminder-empty rounded-lg p-4 space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Badge className={`${getStatusColor(parameter.status)} text-sm px-3 py-1 w-fit backdrop-blur-sm`}>
                {parameter.status.charAt(0).toUpperCase() + parameter.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Category</span>
                </div>
                <p className="text-white font-medium ml-6">{parameter.category}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Issue Date</span>
                </div>
                <p className="text-white font-medium ml-6">
                  {format(new Date(parameter.issue_date), 'PPP')}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-gray-400">Expiry Date</span>
                </div>
                <p className="text-white font-medium ml-6">
                  {format(new Date(parameter.expiry_date), 'PPP')}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Dairy Unit</span>
                </div>
                <p className="text-white font-medium ml-6">
                  {isLoadingDairyUnits ? 'Loading...' : dairyUnitName}
                </p>
              </div>
            </div>
            {parameter.description && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Description</span>
                </div>
                <p className="text-gray-300 ml-6 text-sm leading-relaxed">{parameter.description}</p>
              </div>
            )}
          </div>

          {/* Add Note Section */}
          <div className="glass-reminder-empty rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Add Note
            </h3>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this parameter..."
              className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 mb-3 min-h-[80px] resize-none backdrop-blur-sm"
            />
            <Button 
              onClick={handleAddNote}
              disabled={!newNote.trim() || isAddingNote}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto backdrop-blur-sm"
            >
              {isAddingNote ? 'Adding...' : 'Add Note'}
            </Button>
          </div>

          {/* Notes Section */}
          {notes.length > 0 && (
            <div className="glass-reminder-empty rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                Notes ({notes.length})
              </h3>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {notes.map((note) => (
                  <div key={note.id} className="glass-card rounded-lg p-3 border-0">
                    <p className="text-gray-300 text-sm mb-2">{note.note_text}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {note.user_name || 'Unknown'}
                      </div>
                      <span>
                        {note.created_at && !isNaN(new Date(note.created_at).getTime())
                          ? format(new Date(note.created_at), 'PPP p')
                          : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Section */}
          <div className="glass-reminder-empty rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              Change History
            </h3>
            {isLoadingHistory ? (
              <span className="text-gray-400">Loading history...</span>
            ) : history.length === 0 ? (
              <span className="text-gray-400">No history available.</span>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {history.map((h) => (
                  <div key={h.id} className="glass-card rounded-lg p-3 border-0">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <User className="w-3 h-3" />
                      {h.user_name || 'Unknown User'}
                      <span>•</span>
                      <span>
                        {h.created_at && !isNaN(new Date(h.created_at).getTime())
                          ? format(new Date(h.created_at), 'PPP p')
                          : '-'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-1">
                      {h.action === 'created' && 'Parameter was created'}
                      {h.action === 'deleted' && 'Parameter was deleted'}
                      {h.action === 'updated' && h.field_name && (
                        <>
                          {h.field_name}: {h.old_value ?? '-'} → {h.new_value ?? '-'}
                        </>
                      )}
                      {!(h.action === 'created' || h.action === 'deleted' || (h.action === 'updated' && h.field_name)) && '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ParameterDetailPage; 