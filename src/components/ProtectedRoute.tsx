
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
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if profile is truly missing (not found error)
    if (
      !loading &&
      user &&
      !profileLoading &&
      !profile &&
      profileError &&
      profileError.code === 'PGRST116' && // Not found error
      location.pathname !== '/complete-profile' &&
      location.pathname !== '/profile'
    ) {
      navigate('/complete-profile');
    }
  }, [user, loading, profile, profileLoading, profileError, navigate, location.pathname]);

  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Show login form or redirect to login
    return <AuthForm />;
  }

  // If there is a profile fetch error (other than not found), show error
  if (profileError && profileError.code !== 'PGRST116') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
        <div>
          <h2 className="text-2xl font-bold mb-2">Profile Error</h2>
          <p>{profileError.message || 'An error occurred while loading your profile.'}</p>
        </div>
      </div>
    );
  }

  // If profile is missing, user will be redirected above (except for /profile)
  return <>{children}</>;
};
