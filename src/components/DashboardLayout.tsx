import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-900 transition-smooth">
      {/* Desktop Sidebar */}
      <Sidebar />
      {/* Mobile Hamburger + Drawer */}
      <div className="lg:hidden flex items-center p-4 bg-gray-900 border-b border-gray-800">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button onClick={() => setDrawerOpen(true)} className="text-white">
              <Menu className="w-7 h-7" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <Sidebar />
          </DrawerContent>
        </Drawer>
        <h1 className="ml-4 text-xl font-bold text-white">StatMonitor</h1>
      </div>
      <div className="lg:pl-64 transition-smooth">
        <main className="p-6 bg-gray-900 min-h-screen smooth-scroll animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
