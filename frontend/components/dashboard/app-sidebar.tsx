import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

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
import { useRef, useState } from "react";

interface NavItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  description?: string;
}

export function AppSidebar() {
     const { state, toggleSidebar } = useSidebar();
  const [activeItem, setActiveItem] = useState('create');
  const containerRef = useRef<HTMLDivElement>(null);

    const mainNavItems: NavItem[] = [
    {
      id: 'home',
      title: 'Dashboard',
      icon: <Home size={20} />,
      href: '/dashboard',
      description: 'View overview',
    },
    {
      id: 'create',
      title: 'Create Project',
      icon: <Plus size={20} />,
      href: '/dashboard/create',
      description: 'Start new project',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: <User size={20} />,
      href: '/dashboard/profile',
      description: 'Manage account',
    },
    {
      id: 'history',
      title: 'History',
      icon: <Clock size={20} />,
      href: '/dashboard/history',
      badge: 3,
      description: 'Recent generations',
    },
  ];

  const settingsNavItems: NavItem[] = [
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings size={20} />,
      href: '/dashboard/settings',
      description: 'Preferences',
    },
  ];

  const handleNavigation = (itemId: string) => {
    setActiveItem(itemId);
  };


  return (
    <Sidebar className="border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <SidebarHeader className="border-b border-gray-200 dark:border-slate-700 px-0">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center flex-shrink-0">
              <BookOpen size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                VoiceBook
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                Audio Stories
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* main navigation */}
      <SidebarContent className="flex flex-col justify-between">
        <div>
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.id} className="mt-6">
                      <Link href={item.href} onClick={() => handleNavigation(item.id)}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeItem === item.id}
                          className={`relative group transition-all duration-200 ${
                            activeItem === item.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg'
                              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <button className="w-full flex items-center gap-3 px-4 py-6 rounded-lg">
                            <span className="flex-shrink-0">{item.icon}</span>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-semibold flex-shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </button>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}