import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmailVerified: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: 'url(/auth-bg.jpg)' }}>
      <div className="w-full max-w-md">
        <div className="glass-card-vista shadow-2xl">
          <CardHeader>
            <CardTitle className="text-green-400">Email Verified!</CardTitle>
            <CardDescription className="text-gray-200">
              Your email has been successfully verified. You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 mt-4">
              <Button className="glass-btn-vista w-full" onClick={() => navigate('/')}>Login Now</Button>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified; 