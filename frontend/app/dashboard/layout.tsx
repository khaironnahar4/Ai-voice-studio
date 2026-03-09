"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import {
  Menu,
  X,
  Plus,
  User,
  Clock,
  Settings,
  LogOut,
  Home,
  BookOpen,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);

  // Animation for sidebar collapse/expand
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: sidebarOpen ? 280 : 100,
        duration: 0.4,
        ease: 'power2.inOut',
      });
    }

    if (sidebarContentRef.current) {
      gsap.to(sidebarContentRef.current, {
        opacity: sidebarOpen ? 1 : 0,
        duration: 0.3,
        ease: 'power2.inOut',
        delay: sidebarOpen ? 0.1 : 0,
      });
    }
  }, [sidebarOpen]);



  const handleSignOut = () => {
    // Add signout logic here
    console.log('Signing out...');
  };

  return (

     <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar */}
      

      {/* Main Content Area */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: 280 }}
      >
        {/* Top Navbar */}
        <nav className="h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-30">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group">
                <Bell size={20} className="text-gray-600 dark:text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Notifications
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-xs text-gray-600 dark:text-slate-400 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                      Your audio generation completed
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-400 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                      New project shared with you
                    </div>
                  </div>
                </div>
              </button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        John Doe
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        author@example.com
                      </p>
                    </div>
                    <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 overflow-hidden flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                        JD
                      </div>
                    </div>
                    <ChevronDown size={18} className="text-gray-600 dark:text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      author@example.com
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2" size={16} />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2" size={16} />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2" size={16} />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}