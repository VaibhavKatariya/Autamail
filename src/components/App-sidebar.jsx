'use client';
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
          title: "users",
          url: "/u/users",
        },
        {
          title: "Logs",
          url: "/u/logs",
        },
      ],
    },
  ],
};

export function AppSidebar({ authUser = { displayName: "", email: "", photo: "" }, onLogout, ...props }) {
  const router = useRouter(); // Initialize the router

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
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <button onClick={() => router.push(item.url)}>{item.title}</button>
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
