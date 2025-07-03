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
  <nav className="flex justify-around bg-gray-800 border-t border-gray-700 py-2">
    {navItems.map((item) => (
      <NavLink
        key={item.name}
        to={item.path}
        className={({ isActive }) =>
          `flex flex-col items-center text-xs px-2 py-1 transition-colors ${
            isActive ? 'text-blue-400' : 'text-gray-300 hover:text-white'
          }`
        }
      >
        <item.icon className="w-6 h-6 mb-1" />
        {item.name}
      </NavLink>
    ))}
  </nav>
); 