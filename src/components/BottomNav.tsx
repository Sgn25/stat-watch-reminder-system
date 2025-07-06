
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, Calendar, User } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Parameters', icon: FileText, path: '/parameters' },
  { name: 'Reminders', icon: Bell, path: '/reminders' },
  { name: 'Calendar', icon: Calendar, path: '/calendar' },
  { name: 'Profile', icon: User, path: '/profile' },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-gray-800 border-t border-gray-700 py-2 px-2 safe-area-pb">
    <div className="flex justify-around max-w-md mx-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs px-2 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
              isActive 
                ? 'text-blue-400 bg-gray-700' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-1 flex-shrink-0" />
          <span className="truncate text-[10px] leading-tight">{item.name}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
