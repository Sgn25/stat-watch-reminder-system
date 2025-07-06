import React, { useState } from 'react';
import { useStatutoryParameters, StatutoryParameter } from '@/hooks/useStatutoryParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { PARAMETER_CATEGORIES } from '@/lib/constants';

interface EditParameterFormProps {
  parameter: StatutoryParameter;
  onClose: () => void;
}

// Utility for display
function toDisplayDate(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export const EditParameterForm = ({ parameter, onClose }: EditParameterFormProps) => {
  const { updateParameter, isUpdatingParameter } = useStatutoryParameters();
  const [formData, setFormData] = useState({
    name: parameter.name,
    category: parameter.category,
    description: parameter.description || '',
    issue_date: parameter.issue_date,
    expiry_date: parameter.expiry_date,
  });

  const categories = PARAMETER_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParameter({ id: parameter.id, ...formData });
    // Add a small delay to ensure the update is processed before closing
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-gray-300">Parameter Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter parameter name"
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          required
        />
      </div>

      <div>
        <Label htmlFor="category" className="text-gray-300">Category</Label>
        <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter description"
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issue_date" className="text-gray-300">Issue Date</Label>
          <Input
            id="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => handleChange('issue_date', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="expiry_date" className="text-gray-300">Expiry Date</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => handleChange('expiry_date', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUpdatingParameter}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isUpdatingParameter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Parameter
        </Button>
      </div>
    </form>
  );
};
