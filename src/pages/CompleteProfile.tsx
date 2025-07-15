import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDairyUnits } from '@/hooks/useDairyUnits';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    if (!error) {
      // Insert email subscription (default to subscribed)
      const { error: subError } = await supabase.from('email_subscriptions').insert({
        user_id: user.id,
        dairy_unit_id: dairyUnitId,
        email_address: user.email,
        is_subscribed: true,
      });
      if (subError) {
        toast({ title: 'Warning', description: 'Profile created, but failed to subscribe to alerts: ' + subError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Profile created!', description: 'You are now subscribed to alerts.', variant: 'default' });
      }
      navigate('/');
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: 'url(/auth-bg.jpg)' }}>
      <div className="w-full max-w-md">
        <div className="glass-card-vista shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Complete Your Profile</CardTitle>
            <CardDescription className="text-gray-200">Please enter your full name and select your dairy unit to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-200">Full Name</label>
                <input
                  className="w-full border rounded p-2 glass-input-vista bg-gray-800 text-white"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-200">Dairy Unit</label>
                <select
                  className="w-full border rounded p-2 glass-input-vista bg-gray-800 text-white"
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
              <Button type="submit" className="w-full glass-btn-vista" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile; 