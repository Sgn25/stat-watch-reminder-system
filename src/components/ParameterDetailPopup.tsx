import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  History, 
  StickyNote,
  User,
  Clock as TimeIcon
} from 'lucide-react';
import { StatutoryParameter } from '@/hooks/useStatutoryParameters';
import { useParameterHistory } from '@/hooks/useParameterHistory';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EditParameterForm } from '@/components/EditParameterForm';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ParameterDetailPopupProps {
  parameter: StatutoryParameter;
  isOpen: boolean;
  onClose: () => void;
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

export const ParameterDetailPopup = ({ parameter, isOpen, onClose }: ParameterDetailPopupProps) => {
  const { deleteParameter, isDeletingParameter } = useStatutoryParameters();
  const { 
    history, 
    notes, 
    isLoadingHistory, 
    isLoadingNotes, 
    addNote, 
    updateNote, 
    deleteNote,
    isAddingNote,
    isUpdatingNote,
    isDeletingNote
  } = useParameterHistory(parameter.id);
  const { profile } = useUserProfile();
  const [creatorName, setCreatorName] = useState<string>('Unknown User');
  const [isFetchingCreator, setIsFetchingCreator] = useState(false);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Fetch creator name if needed
  useEffect(() => {
    async function fetchCreator() {
      setIsFetchingCreator(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', parameter.user_id)
        .single();
      if (!error && data?.full_name) setCreatorName(data.full_name);
      setIsFetchingCreator(false);
    }
    if (parameter.user_id) fetchCreator();
  }, [parameter.user_id]);

  // Synthesize creation info if not present in history
  let displayHistory = history;
  if (!isLoadingHistory && (history.length === 0 || history[history.length - 1].action !== 'created')) {
    displayHistory = [
      ...history,
      {
        id: 'synth-created',
        parameter_id: parameter.id,
        user_id: parameter.user_id,
        action: 'created' as const,
        field_name: 'all',
        old_value: null,
        new_value: null,
        created_at: parameter.created_at,
        user_name: creatorName,
      },
    ];
  }

  const badge = getStatusAndBadge(parameter.daysUntilExpiry);
  const daysText = getDaysRemainingText(parameter.daysUntilExpiry);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this parameter?')) {
      deleteParameter(parameter.id);
      onClose();
    }
  };

  // Simplified note handling
  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(newNote.trim());
      setNewNote('');
    }
  };

  const handleUpdateNote = (id: string) => {
    if (editingNoteText.trim()) {
      updateNote({ id, noteText: editingNoteText.trim() });
      setEditingNoteId(null);
      setEditingNoteText('');
    }
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(id);
    }
  };

  const startEditingNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note_text);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              Parameter Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Parameter Header */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{parameter.name}</h2>
                  <p className="text-gray-400 mb-2">{parameter.category}</p>
                  {parameter.description && (
                    <p className="text-gray-300">{parameter.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${badge.color} ${badge.animate} shadow-sm`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Issued</p>
                    <p className="font-medium">{toDisplayDate(parameter.issue_date)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Expires</p>
                    <p className="font-medium">{toDisplayDate(parameter.expiry_date)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${daysText.color}`}>
                  {daysText.text}
                </span>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Parameter</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                          onClick={handleDelete}
                          disabled={isDeletingParameter}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Parameter</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Tabs for History and Notes */}
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
                <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
                  <History className="w-4 h-4 mr-2" />
                  Update History
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-gray-700">
                  <StickyNote className="w-4 h-4 mr-2" />
                  Additional Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Update History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {isLoadingHistory ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                          <p className="text-gray-400 mt-2">Loading history...</p>
                        </div>
                      ) : displayHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No update history available</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {displayHistory.map((item) => (
                            <div key={item.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium">
                                    {item.action === 'created' ? 'Parameter created' : 
                                     item.action === 'updated' ? 'Parameter updated' : 
                                     'Parameter deleted'}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {item.user_name || 'Unknown User'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <TimeIcon className="w-4 h-4" />
                                      {new Date(item.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {item.action}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Add Note Form - Simplified */}
                    <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <h4 className="text-white font-medium mb-3">Add New Note</h4>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Enter your note here..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="flex-1 bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          rows={3}
                        />
                        <Button
                          onClick={handleAddNote}
                          disabled={!newNote.trim() || isAddingNote}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <ScrollArea className="h-64">
                      {isLoadingNotes ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                          <p className="text-gray-400 mt-2">Loading notes...</p>
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="text-center py-8">
                          <StickyNote className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No notes available</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notes.map((note) => (
                            <div key={note.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                              {editingNoteId === note.id ? (
                                <div className="space-y-3">
                                  <Textarea
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    className="bg-gray-600 border-gray-500 text-white"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateNote(note.id)}
                                      disabled={!editingNoteText.trim() || isUpdatingNote}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingNoteId(null);
                                        setEditingNoteText('');
                                      }}
                                      className="border-gray-500 text-gray-300 hover:bg-gray-600"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-white mb-3">{note.note_text}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {note.user_name || 'Unknown User'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <TimeIcon className="w-4 h-4" />
                                        {new Date(note.created_at).toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startEditingNote(note)}
                                        className="border-gray-500 text-gray-300 hover:bg-gray-600"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteNote(note.id)}
                                        disabled={isDeletingNote}
                                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Parameter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Parameter</DialogTitle>
          </DialogHeader>
          <EditParameterForm parameter={parameter} onClose={() => setIsEditDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
