import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDairyUnits } from '@/hooks/useDairyUnits';

const CompleteProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { dairyUnits } = useDairyUnits();
  const [fullName, setFullName] = useState('');
  const [dairyUnitId, setDairyUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dairyUnitId) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      dairy_unit_id: dairyUnitId,
      email: user.email,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile created!', description: 'Welcome!', variant: 'default' });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
        <div>
          <label className="block mb-1">Full Name</label>
          <input
            className="w-full border rounded p-2"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Dairy Unit</label>
          <select
            className="w-full border rounded p-2"
            value={dairyUnitId}
            onChange={e => setDairyUnitId(e.target.value)}
            required
          >
            <option value="">Select a dairy unit</option>
            {dairyUnits.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded p-2"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile; 