
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStatutoryParameters } from '@/hooks/useStatutoryParameters';

interface AddParameterFormProps {
  onClose?: () => void;
}

export const AddParameterForm = ({ onClose }: AddParameterFormProps) => {
  const { addParameter, isAddingParameter } = useStatutoryParameters();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    issue_date: '',
    expiry_date: '',
    description: ''
  });

  const categories = ['License', 'Certificate', 'Permit', 'Registration', 'Compliance'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.issue_date || !formData.expiry_date) {
      return;
    }

    addParameter({
      name: formData.name,
      category: formData.category,
      issue_date: formData.issue_date,
      expiry_date: formData.expiry_date,
      description: formData.description
    });

    // Reset form
    setFormData({
      name: '',
      category: '',
      issue_date: '',
      expiry_date: '',
      description: ''
    });

    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Parameter Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Business License"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issue_date">Issue Date *</Label>
          <Input
            id="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="expiry_date">Expiry Date *</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description or notes"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isAddingParameter}>
        {isAddingParameter ? 'Adding...' : 'Add Parameter'}
      </Button>
    </form>
  );
};
