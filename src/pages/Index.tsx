
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ParameterCard } from '@/components/ParameterCard';
import { AddParameterForm } from '@/components/AddParameterForm';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ExpirationChart } from '@/components/ExpirationChart';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, FileText, Bell, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { parameters, isLoading } = useStatutoryParameters();
  const { profile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const categories = ['All', 'License', 'Certificate', 'Permit', 'Registration', 'Compliance'];

  const filteredParameters = parameters.filter(param => {
    const matchesSearch = param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         param.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || param.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusCounts = () => {
    return {
      total: parameters.length,
      valid: parameters.filter(p => p.status === 'valid').length,
      warning: parameters.filter(p => p.status === 'warning').length,
      expired: parameters.filter(p => p.status === 'expired').length
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-gray-300">Loading your parameters...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">
                  {profile?.dairy_unit?.name || 'Dairy Management'} Dashboard
                </h1>
              </div>
              <p className="text-gray-400 mt-1">Monitor and manage your dairy unit's statutory parameters</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-blue-500/25">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Parameter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Statutory Parameter</DialogTitle>
                </DialogHeader>
                <AddParameterForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Parameters</p>
                  <p className="text-2xl font-bold text-white">{statusCounts.total}</p>
                </div>
                <LayoutDashboard className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Valid</p>
                  <p className="text-2xl font-bold text-green-400">{statusCounts.valid}</p>
                </div>
                <FileText className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Expiring Soon</p>
                  <p className="text-2xl font-bold text-amber-400">{statusCounts.warning}</p>
                </div>
                <Bell className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Expired</p>
                  <p className="text-2xl font-bold text-red-400">{statusCounts.expired}</p>
                </div>
                <Bell className="w-8 h-8 text-red-400 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Expiration Timeline</h2>
            <ExpirationChart parameters={parameters} />
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
            <div className="md:w-48">
              <CategoryFilter 
                categories={categories} 
                selectedCategory={selectedCategory} 
                onCategoryChange={setSelectedCategory} 
              />
            </div>
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParameters.map(parameter => (
              <ParameterCard key={parameter.id} parameter={parameter} />
            ))}
          </div>

          {filteredParameters.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No parameters found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria, or add your first parameter</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Index;
