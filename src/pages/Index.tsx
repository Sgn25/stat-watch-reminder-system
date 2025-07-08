
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ParameterCard } from '@/components/ParameterCard';
import { AddParameterForm } from '@/components/AddParameterForm';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, FileText, Bell, Building2, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';
import { PARAMETER_CATEGORIES } from '@/lib/constants';
import { ComplianceLiquidGauge } from '@/components/ComplianceLiquidGauge';

const Index = () => {
  const { parameters, isLoading } = useStatutoryParameters();
  const { profile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'valid' | 'warning' | 'expired'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

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
    const baseStyle = "group bg-gray-800 p-4 lg:p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-200 cursor-pointer";
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
    // Not selected: apply ring on hover
    switch (status) {
      case 'all': return `${baseStyle} hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50`;
      case 'valid': return `${baseStyle} hover:ring-2 hover:ring-green-400 hover:ring-opacity-50`;
      case 'warning': return `${baseStyle} hover:ring-2 hover:ring-amber-400 hover:ring-opacity-50`;
      case 'expired': return `${baseStyle} hover:ring-2 hover:ring-red-400 hover:ring-opacity-50`;
      default: return baseStyle;
    }
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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-blue-500/25 w-full sm:w-auto" onClick={() => navigate('/parameters/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </div>

          {/* Status Overview Cards and Compliance Score */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Status Cards - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4 gap-2 lg:gap-4">
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
            <div className="col-span-full lg:col-span-1 flex flex-col items-center justify-center mt-4 lg:mt-0">
              <ComplianceLiquidGauge percentage={complianceScore} width={100} height={100} />
              <p className="text-gray-400 text-xs mt-2 text-center">Parameters currently valid</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
