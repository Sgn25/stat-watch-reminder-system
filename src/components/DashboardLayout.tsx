
import React from 'react';
import { Sidebar } from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-6 bg-gray-900 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};
