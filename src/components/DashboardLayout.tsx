
import React from 'react';
import { Sidebar } from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-900 transition-smooth">
      <Sidebar />
      <div className="lg:pl-64 transition-smooth">
        <main className="p-6 bg-gray-900 min-h-screen smooth-scroll animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
