
import React from 'react';
import { LayoutDashboard, FileText, Bell, User, Calendar } from 'lucide-react';

export const Sidebar = () => {
  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, current: true },
    { name: 'Parameters', icon: FileText, current: false },
    { name: 'Reminders', icon: Bell, current: false },
    { name: 'Calendar', icon: Calendar, current: false },
    { name: 'Profile', icon: User, current: false },
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 py-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-blue-600">StatutoryMonitor</h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <a
                      href="#"
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                        item.current
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${
                          item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};
