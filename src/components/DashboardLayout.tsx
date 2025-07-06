
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerClose } from '@/components/ui/drawer';
import { Menu, X } from 'lucide-react';
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
      <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button onClick={() => setDrawerOpen(true)} className="text-white p-2 hover:bg-gray-800 rounded-md">
              <Menu className="w-6 h-6" />
            </button>
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerOverlay className="fixed inset-0 bg-black/50 z-40" />
            <div
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 flex flex-col bg-gray-800 border-r border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold text-white">StatMonitor</h1>
                <DrawerClose asChild>
                  <button 
                    className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded" 
                    onClick={() => setDrawerOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </DrawerClose>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar mobile onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          </DrawerPortal>
        </Drawer>
        <h1 className="text-xl font-bold text-white">StatMonitor</h1>
      </div>
      
      <div className="lg:pl-64 transition-smooth">
        <main className="p-4 lg:p-6 bg-gray-900 min-h-screen smooth-scroll animate-fade-in pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
