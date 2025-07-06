
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ParameterCard } from '@/components/ParameterCard';
import { AddParameterForm } from '@/components/AddParameterForm';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, FileText, Bell, Building2, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';
import { PARAMETER_CATEGORIES } from '@/lib/constants';

const Index = () => {
  const { parameters, isLoading } = useStatutoryParameters();
  const { profile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'valid' | 'warning' | 'expired'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', ...PARAMETER_CATEGORIES];

  const filteredParameters = parameters.filter(param => {
    const matchesSearch = param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         param.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || param.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || param.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
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
  const complianceScore = statusCounts.total > 0 ? Math.round((statusCounts.valid / statusCounts.total) * 100) : 0;
  const complianceFraction = statusCounts.total > 0 ? statusCounts.valid / statusCounts.total : 0;

  const handleStatusFilter = (status: 'all' | 'valid' | 'warning' | 'expired') => {
    setSelectedStatus(status);
  };

  const getStatusCardStyle = (status: 'all' | 'valid' | 'warning' | 'expired') => {
    const baseStyle = "bg-gray-800 p-4 lg:p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-200 cursor-pointer";
    const isSelected = selectedStatus === status;
    
    if (isSelected) {
      switch (status) {
        case 'all': return `${baseStyle} ring-2 ring-blue-400 ring-opacity-50`;
        case 'valid': return `${baseStyle} ring-2 ring-green-400 ring-opacity-50`;
        case 'warning': return `${baseStyle} ring-2 ring-amber-400 ring-opacity-50`;
        case 'expired': return `${baseStyle} ring-2 ring-red-400 ring-opacity-50`;
        default: return baseStyle;
      }
    }
    return baseStyle;
  };

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
        <div className="space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 animate-pulse" />
                <h1 className="text-xl lg:text-3xl font-bold text-white">
                  StatMonitor - {profile?.dairy_unit?.name || 'Dairy Management'} Dashboard
                </h1>
              </div>
              <p className="text-gray-400 mt-1 text-sm lg:text-base">Monitor and manage your dairy unit's statutory parameters</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-blue-500/25 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Parameter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Statutory Parameter</DialogTitle>
                </DialogHeader>
                <AddParameterForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Status Overview Cards and Compliance Score */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Status Cards - responsive grid */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
              <div 
                className={getStatusCardStyle('all')}
                onClick={() => handleStatusFilter('all')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-400">Total Parameters</p>
                    <p className="text-lg lg:text-2xl font-bold text-white">{statusCounts.total}</p>
                  </div>
                  <LayoutDashboard className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />
                </div>
              </div>
              <div 
                className={getStatusCardStyle('valid')}
                onClick={() => handleStatusFilter('valid')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-400">Valid</p>
                    <p className="text-lg lg:text-2xl font-bold text-green-400">{statusCounts.valid}</p>
                  </div>
                  <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
                </div>
              </div>
              <div 
                className={getStatusCardStyle('warning')}
                onClick={() => handleStatusFilter('warning')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-400">Expiring Soon</p>
                    <p className="text-lg lg:text-2xl font-bold text-amber-400">{statusCounts.warning}</p>
                  </div>
                  <Bell className="w-6 h-6 lg:w-8 lg:h-8 text-amber-400" />
                </div>
              </div>
              <div 
                className={getStatusCardStyle('expired')}
                onClick={() => handleStatusFilter('expired')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-400">Expired</p>
                    <p className="text-lg lg:text-2xl font-bold text-red-400">{statusCounts.expired}</p>
                  </div>
                  <Bell className="w-6 h-6 lg:w-8 lg:h-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* Compliance Score - responsive */}
            <div className="lg:col-span-1 col-span-full">
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-white mb-3 text-center">Compliance Score</h3>
                <div className="relative w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="#23272f" stroke="#374151" strokeWidth="3" />
                    <circle
                      cx="60" cy="60" r="50"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="8"
                      strokeDasharray={314.16}
                      strokeDashoffset={314.16 * (1 - complianceFraction)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,2,.6,1)' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl lg:text-2xl font-bold text-blue-400">{complianceScore}%</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2 text-center">Parameters currently valid</p>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full sm:w-48">
                <CategoryFilter 
                  categories={categories} 
                  selectedCategory={selectedCategory} 
                  onCategoryChange={setSelectedCategory} 
                />
              </div>
            </div>
          </div>

          {/* Parameters Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredParameters.map(parameter => (
                <ParameterCard key={parameter.id} parameter={parameter} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-700 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              {filteredParameters.map(parameter => (
                <ParameterCard key={parameter.id} parameter={parameter} viewMode="list" />
              ))}
            </div>
          )}

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
