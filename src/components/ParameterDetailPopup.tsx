
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Calendar, FileText, Building2, Clock, User, MessageSquare, X } from 'lucide-react';
import { format } from 'date-fns';
import { useParameterHistory } from '@/hooks/useParameterHistory';
import { useAuth } from '@/hooks/useAuth';
import { useDairyUnits } from '@/hooks/useDairyUnits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Parameter {
  id: string;
  name: string;
  category: string;
  issue_date: string;
  expiry_date: string;
  description?: string;
  status: 'valid' | 'warning' | 'expired';
  dairy_unit_id?: string;
}

interface ParameterDetailPopupProps {
  parameter: Parameter;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (parameter: Parameter) => void;
}

export const ParameterDetailPopup: React.FC<ParameterDetailPopupProps> = ({
  parameter,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { user } = useAuth();
  const { history, notes, addNote, isLoadingHistory } = useParameterHistory(parameter.id);
  const { dairyUnits, isLoading: isLoadingDairyUnits } = useDairyUnits();
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Get dairy unit name from the dairy units list
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] bg-gray-800 border-gray-700 text-white mx-4 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white pr-8">{parameter.name}</DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1 hover:bg-gray-700 rounded-full transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 pr-2">
            {/* Parameter Details */}
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Badge className={`${getStatusColor(parameter.status)} text-sm px-3 py-1 w-fit`}>
                  {parameter.status.charAt(0).toUpperCase() + parameter.status.slice(1)}
                </Badge>
                <Button 
                  onClick={() => onEdit(parameter)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-600 w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Parameter
                </Button>
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
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Add Note
              </h3>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this parameter..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 mb-3 min-h-[80px] resize-none"
              />
              <Button 
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                {isAddingNote ? 'Adding...' : 'Add Note'}
              </Button>
            </div>

            {/* Notes Section */}
            {notes.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  Notes ({notes.length})
                </h3>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                      <p className="text-gray-300 text-sm mb-2">{note.note_text}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span>By: {note.user_name || 'Unknown User'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(note.created_at), 'PPp')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Section */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                Change History ({history.length})
              </h3>
              {isLoadingHistory ? (
                <div className="text-gray-400 text-sm">Loading history...</div>
              ) : history.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((entry) => (
                    <div key={entry.id} className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-gray-500 text-gray-300 w-fit">
                            {entry.action}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <User className="w-3 h-3" />
                            <span>Updated by: {entry.user_name || 'Unknown User'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(entry.created_at), 'PPp')}</span>
                        </div>
                      </div>
                      {entry.field_name && entry.field_name !== 'all' && (
                        <div className="space-y-1 text-xs">
                          <p className="text-gray-400">Field: <span className="text-white">{entry.field_name}</span></p>
                          {entry.old_value && (
                            <p className="text-gray-400">From: <span className="text-red-300">{entry.old_value}</span></p>
                          )}
                          {entry.new_value && (
                            <p className="text-gray-400">To: <span className="text-green-300">{entry.new_value}</span></p>
                          )}
                        </div>
                      )}
                      {entry.field_name === 'all' && (
                        <div className="text-xs text-gray-400">
                          {entry.action === 'created' ? 'Parameter was created' : 'Parameter was deleted'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  No change history available for this parameter.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
