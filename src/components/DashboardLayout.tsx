import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerClose } from '@/components/ui/drawer';
import { Menu } from 'lucide-react';
import { useState } from 'react';

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
          <DrawerPortal>
            <DrawerOverlay />
            <div
              className="fixed inset-y-0 left-0 w-64 z-50 flex flex-col bg-gray-800 border-r border-gray-700"
              style={{ maxHeight: '100vh', overflowY: 'auto' }}
            >
              <Sidebar mobile />
              <DrawerClose asChild>
                <button className="absolute top-2 right-2 text-gray-400 text-2xl" onClick={() => setDrawerOpen(false)}>
                  ×
                </button>
              </DrawerClose>
            </div>
          </DrawerPortal>
        </Drawer>
        <h1 className="ml-4 text-xl font-bold text-white">StatMonitor</h1>
      </div>
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
