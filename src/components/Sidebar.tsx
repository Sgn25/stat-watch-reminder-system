
import React from 'react';
import { LayoutDashboard, FileText, Bell, User, Calendar, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserInfoDisplay } from '@/components/UserInfoDisplay';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export const Sidebar = ({ mobile = false, onNavigate }: SidebarProps) => {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Parameters', icon: FileText, path: '/parameters' },
    { name: 'Reminders', icon: Bell, path: '/reminders' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleSignOut = () => {
    signOut();
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className={mobile ? 'flex flex-col h-full min-h-0' : 'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col'}>
      <div className={`flex grow flex-col gap-y-5 ${mobile ? 'overflow-y-auto mobile-menu-scrollbar' : 'overflow-y-auto'} bg-gray-800 border-r border-gray-700 px-4 lg:px-6 py-4`}>
        {!mobile && (
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-400 animate-pulse" />
              <h1 className="text-xl font-bold text-white">StatMonitor</h1>
            </div>
          </div>
        )}
        
        <UserInfoDisplay />
        
        {profile?.dairy_unit && (
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Current Unit</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white text-sm">{profile.dairy_unit.name}</p>
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                {profile.dairy_unit.code}
              </Badge>
            </div>
          </div>
        )}

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) => `group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-gray-300 hover:text-red-400 hover:bg-gray-700 p-3"
              >
                <LogOut className="h-6 w-6 shrink-0 mr-3" />
                Sign Out
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};
