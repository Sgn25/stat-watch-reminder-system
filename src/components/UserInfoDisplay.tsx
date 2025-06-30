
import React from 'react';
import { User, Mail, Building2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';

export const UserInfoDisplay = () => {
  const { profile } = useUserProfile();
  const { user } = useAuth();

  if (!profile || !user) return null;

  return (
    <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 mb-4">
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">{profile.full_name || 'User'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Mail className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">{user.email}</span>
        </div>
        <div className="flex items-center gap-1">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">{profile.dairy_unit?.name}</span>
        </div>
      </div>
    </div>
  );
};
