import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success' | 'invalid'>('form');
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is in a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (
        session &&
        session.user &&
        session.user.email &&
        session.user.aud === 'authenticated' &&
        session.user.email_confirmed_at // user is confirmed
      ) {
        setStep('form');
      } else {
        setStep('invalid');
      }
      setChecking(false);
    };
    checkSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep('success');
      toast({
        title: 'Success!',
        description: 'Your password has been reset successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: 'url(/auth-bg.jpg)' }}>
      <div className="w-full max-w-md">
        <div className="glass-card-vista shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Reset Password</CardTitle>
            <CardDescription className="text-gray-200">
              {step === 'form' ? 'Enter your new password below.' : step === 'success' ? 'Your password has been updated.' : 'Invalid or expired reset link.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="text-center text-gray-300">Checking reset link...</div>
            ) : step === 'form' ? (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="glass-input-vista"
                    required
                  />
                </div>
                <div>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="glass-input-vista"
                    required
                  />
                </div>
                <Button type="submit" className="w-full glass-btn-vista" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            ) : step === 'success' ? (
              <div className="text-center text-green-400 mt-4">
                Password Reset Successfully!<br />
                <a href="/" className="text-blue-400 underline mt-4 inline-block" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                  Login Now
                </a>
              </div>
            ) : (
              <div className="text-center text-red-400 mt-4">
                Invalid or expired reset link.<br />
                <a href="/forgot-password" className="text-blue-400 underline mt-4 inline-block">
                  Request a new reset link
                </a>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 