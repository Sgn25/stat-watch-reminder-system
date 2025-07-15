import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: 'Check your email',
        description: 'A reset code has been sent to your email if it is registered.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email.',
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
            <CardTitle className="text-white">Forgot Password</CardTitle>
            <CardDescription className="text-gray-200">Enter your registered email to receive a reset code.</CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="glass-input-vista"
                    required
                  />
                </div>
                <Button type="submit" className="w-full glass-btn-vista" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>
            ) : (
              <div className="text-center text-green-400 mt-4">
                If your email is registered, you will receive a reset code shortly.<br />
                <a href="/reset-password" className="text-blue-400 underline mt-4 inline-block">Already have a code? Reset Password</a>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 