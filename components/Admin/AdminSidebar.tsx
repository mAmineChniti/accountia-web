'use client';

import * as React from 'react';
import { Users, BarChart3, LayoutDashboard } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { Dictionary } from '@/get-dictionary';

export type AdminView = 'users' | 'statistics';

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  dictionary: Dictionary;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export function AdminSidebar({
  dictionary,
  activeView,
  onViewChange,
  ...props
}: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-sidebar-border/50 border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="truncate text-lg group-data-[collapsible=icon]:hidden">
            {dictionary.admin?.title || 'Accountia Admin'}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-4 text-xs font-bold tracking-wider uppercase">
            {dictionary.admin?.statisticsTitle || 'Statistics'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === 'statistics'}
                  onClick={() => onViewChange('statistics')}
                  tooltip={
                    dictionary.admin?.statisticsTitle || 'Business Statistics'
                  }
                  className="px-4"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    {dictionary.admin?.statisticsTitle || 'Statistics'}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-4 text-xs font-bold tracking-wider uppercase">
            {dictionary.admin?.usersTitle || 'Administration'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === 'users'}
                  onClick={() => onViewChange('users')}
                  tooltip={dictionary.admin?.usersTitle || 'User Management'}
                  className="px-4"
                >
                  <Users className="h-4 w-4" />
                  <span>
                    {dictionary.admin?.usersTitle || 'Users Management'}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
