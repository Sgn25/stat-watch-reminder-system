
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ParameterCard } from '@/components/ParameterCard';
import { AddParameterForm } from '@/components/AddParameterForm';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ExpirationChart } from '@/components/ExpirationChart';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface StatutoryParameter {
  id: string;
  name: string;
  category: string;
  issueDate: Date;
  expiryDate: Date;
  description?: string;
  status: 'valid' | 'warning' | 'expired';
  daysUntilExpiry: number;
}

const Index = () => {
  const [parameters, setParameters] = useState<StatutoryParameter[]>([
    {
      id: '1',
      name: 'Business License',
      category: 'License',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2025-01-15'),
      description: 'General business operating license',
      status: 'valid',
      daysUntilExpiry: 201
    },
    {
      id: '2',
      name: 'Fire Safety Certificate',
      category: 'Certificate',
      issueDate: new Date('2024-03-01'),
      expiryDate: new Date('2024-09-01'),
      description: 'Annual fire safety inspection certificate',
      status: 'expired',
      daysUntilExpiry: -119
    },
    {
      id: '3',
      name: 'Health Department Permit',
      category: 'Permit',
      issueDate: new Date('2024-05-01'),
      expiryDate: new Date('2024-12-31'),
      description: 'Food service health permit',
      status: 'warning',
      daysUntilExpiry: 3
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const categories = ['All', 'License', 'Certificate', 'Permit'];

  const filteredParameters = parameters.filter(param => {
    const matchesSearch = param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         param.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || param.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addParameter = (newParam: Omit<StatutoryParameter, 'id' | 'daysUntilExpiry' | 'status'>) => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((newParam.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: 'valid' | 'warning' | 'expired' = 'valid';
    if (daysUntilExpiry < 0) status = 'expired';
    else if (daysUntilExpiry <= 30) status = 'warning';

    const parameter: StatutoryParameter = {
      ...newParam,
      id: Date.now().toString(),
      daysUntilExpiry,
      status
    };

    setParameters(prev => [...prev, parameter]);
    setIsAddDialogOpen(false);
  };

  const getStatusCounts = () => {
    return {
      total: parameters.length,
      valid: parameters.filter(p => p.status === 'valid').length,
      warning: parameters.filter(p => p.status === 'warning').length,
      expired: parameters.filter(p => p.status === 'expired').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statutory Parameters Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor and manage your licenses, certificates, and permits</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Parameter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Statutory Parameter</DialogTitle>
              </DialogHeader>
              <AddParameterForm onAdd={addParameter} categories={categories.slice(1)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parameters</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
              <LayoutDashboard className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.valid}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.warning}</p>
              </div>
              <Bell className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.expired}</p>
              </div>
              <Bell className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expiration Timeline</h2>
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

        {filteredParameters.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parameters found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
