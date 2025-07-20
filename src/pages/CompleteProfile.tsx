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
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dairyUnitId) {
      toast({ title: 'Error', description: 'Name and Dairy Unit are required', variant: 'destructive' });
      return;
    }

    // Validate WhatsApp number format if provided
    if (whatsappNumber && !/^\+?[1-9]\d{1,14}$/.test(whatsappNumber)) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid WhatsApp number (e.g., +1234567890 or 1234567890)', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      dairy_unit_id: dairyUnitId,
      email: user.email,
      whatsapp_number: whatsappNumber || null,
    });
    if (!error) {
      // Insert email subscription (default to subscribed)
      const { error: subError } = await supabase.from('email_subscriptions').insert({
        user_id: user.id,
        dairy_unit_id: dairyUnitId,
        email_address: user.email,
        is_subscribed: true,
      });
      
      // Insert WhatsApp subscription if number provided
      if (whatsappNumber) {
        const { error: whatsappSubError } = await supabase.from('whatsapp_subscriptions').insert({
          user_id: user.id,
          dairy_unit_id: dairyUnitId,
          whatsapp_number: whatsappNumber,
          is_subscribed: true,
        });
        if (whatsappSubError) {
          toast({ title: 'Warning', description: 'Profile created, but failed to subscribe to WhatsApp alerts: ' + whatsappSubError.message, variant: 'destructive' });
        }
      }

      if (subError) {
        toast({ title: 'Warning', description: 'Profile created, but failed to subscribe to email alerts: ' + subError.message, variant: 'destructive' });
      } else {
        const message = whatsappNumber 
          ? 'You are now subscribed to email and WhatsApp alerts.'
          : 'You are now subscribed to email alerts.';
        toast({ title: 'Profile created!', description: message, variant: 'default' });
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
              <div>
                <label className="block mb-1 text-gray-200">WhatsApp Number (Optional)</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 glass-input-vista bg-gray-800 text-white"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder="+1234567890"
                />
                <p className="text-xs text-gray-400 mt-1">Enter your WhatsApp number to receive WhatsApp reminders</p>
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