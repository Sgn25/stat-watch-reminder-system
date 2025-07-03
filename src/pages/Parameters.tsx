import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2, Plus, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AddParameterForm } from '@/components/AddParameterForm';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

// Utility for display
function toDisplayDate(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

const Parameters = () => {
  const { parameters, isLoading, deleteParameter } = useStatutoryParameters();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredParameters = parameters.filter(param =>
    param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-600';
      case 'warning': return 'bg-amber-600';
      case 'expired': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this parameter?')) {
      deleteParameter(id);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-gray-300">Loading parameters...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header and search section */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Parameters</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Parameter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Parameter</DialogTitle>
                </DialogHeader>
                <AddParameterForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-300">Issue Date</TableHead>
                  <TableHead className="text-gray-300">Expiry Date</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParameters.map((parameter) => (
                  <TableRow key={parameter.id} className="border-gray-700 hover:bg-gray-700">
                    <TableCell className="text-white font-medium">{parameter.name}</TableCell>
                    <TableCell className="text-gray-300">{parameter.category}</TableCell>
                    <TableCell className="text-gray-300">
                      {toDisplayDate(parameter.issue_date)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {toDisplayDate(parameter.expiry_date)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(parameter.status)} text-white`}>
                        {parameter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedParameter(parameter);
                            setIsDetailOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(parameter.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-gray-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Parameter Detail Dialog */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Parameter Details</DialogTitle>
              </DialogHeader>
              {selectedParameter && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedParameter.name}</h3>
                    <p className="text-gray-400">{selectedParameter.category}</p>
                  </div>
                  {selectedParameter.description && (
                    <div>
                      <h4 className="font-medium text-gray-300">Description</h4>
                      <p className="text-gray-400">{selectedParameter.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-300">Issue Date</h4>
                      <p className="text-white">{toDisplayDate(selectedParameter.issue_date)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-300">Expiry Date</h4>
                      <p className="text-white">{toDisplayDate(selectedParameter.expiry_date)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300">Status</h4>
                    <Badge className={`${getStatusColor(selectedParameter.status)} text-white mt-1`}>
                      {selectedParameter.status} - {selectedParameter.daysUntilExpiry > 0 
                        ? `${selectedParameter.daysUntilExpiry} days remaining`
                        : `Expired ${Math.abs(selectedParameter.daysUntilExpiry)} days ago`}
                    </Badge>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleDelete(selectedParameter.id);
                        setIsDetailOpen(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Parameters;
