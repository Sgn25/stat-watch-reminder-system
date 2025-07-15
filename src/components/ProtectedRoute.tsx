
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Allow /profile route even if profile is missing
    if (!loading && user && !profileLoading && !profile && location.pathname !== '/complete-profile' && location.pathname !== '/profile') {
      navigate('/complete-profile');
    }
  }, [user, loading, profile, profileLoading, navigate, location.pathname]);

  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Show login form or redirect to login
    return <AuthForm />;
  }

  // If profile is missing, user will be redirected above (except for /profile)
  return <>{children}</>;
};
