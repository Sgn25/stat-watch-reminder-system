
import React from 'react';
import { LayoutDashboard, FileText, Bell, User, Calendar, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Sidebar = () => {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, current: true },
    { name: 'Parameters', icon: FileText, current: false },
    { name: 'Reminders', icon: Bell, current: false },
    { name: 'Calendar', icon: Calendar, current: false },
    { name: 'Profile', icon: User, current: false },
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 border-r border-gray-700 px-6 py-4">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Dairy Manager</h1>
          </div>
        </div>
        
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
                    <a
                      href="#"
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                        item.current
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${
                          item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start text-gray-300 hover:text-red-400 hover:bg-gray-700"
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
