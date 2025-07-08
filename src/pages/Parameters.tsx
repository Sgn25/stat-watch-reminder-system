import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';

// Utility for display
function toDisplayDate(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

const Parameters = () => {
  const { parameters, isLoading, deleteParameter } = useStatutoryParameters();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Parameters</h1>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={() => navigate('/parameters/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-sm w-full"
            />
          </div>

          <div className="space-y-3 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-gray-700/50">
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-300">Issue Date</TableHead>
                  <TableHead className="text-gray-300">Expiry Date</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="space-y-2">
                {filteredParameters.map((parameter) => (
                  <TableRow key={parameter.id} className="glass-row border-gray-700/30 hover:border-blue-500 transition-all duration-200 rounded-lg mb-2">
                    <TableCell className="text-white font-medium">{parameter.name}</TableCell>
                    <TableCell className="text-gray-300">{parameter.category}</TableCell>
                    <TableCell className="text-gray-300">
                      {toDisplayDate(parameter.issue_date)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {toDisplayDate(parameter.expiry_date)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(parameter.status)} text-white backdrop-blur-sm`}>
                        {parameter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/parameters/${parameter.id}/edit`)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 backdrop-blur-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(parameter.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 backdrop-blur-sm"
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Parameters;
