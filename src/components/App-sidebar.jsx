"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { VersionSwitcher } from "@/components/version-switcher";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar({ authUser = { displayName: "", email: "", photo: "" }, onLogout, ...props }) {
  const router = useRouter();
  const { user, loading, isAdmin, checkingAuth } = useAuth();

  // Sample Data
  const data = {
    versions: [],
    navMain: [
      {
        title: "Sending in pace",
        url: "/",
        items: [
          {
            title: "Dashboard",
            url: "/u/dashboard",
          },
          {
            title: "Logs",
            url: "/u/logs",
          },
          {
            title: "Need Help?",
            url: "/u/help",
          },
        ],
      },
    ],
  };

  // Add admin-only pages if user is admin
  if (isAdmin) {
    data.navMain[0].items.push(
      {
        title: "Manage Users",
        url: "/admin/manageUsers",
      }
    );
  }

  const handleNavClick = (url) => {
    // Check if the user is admin and trying to access a user-specific route
    if (isAdmin && url.startsWith('/u/')) {
      const adminUrl = url.replace('/u/', '/admin/');
      router.push(adminUrl); // Redirect to admin route
    } else {
      router.push(url); // Normal navigation for non-admin or other routes
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
      </SidebarHeader>
      <SidebarContent>
        {/* Sidebar Navigation */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((navItem) => (
                  <SidebarMenuItem key={navItem.title}>
                    <SidebarMenuButton asChild>
                      <button onClick={() => handleNavClick(navItem.url)}>{navItem.title}</button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
