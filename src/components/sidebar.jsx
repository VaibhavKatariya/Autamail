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

  const handleNeedHelp = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER1;
    if (!whatsappNumber) {
      console.error("WhatsApp number not configured in environment variables.");
      return;
    }

    const currentPageUrl = window.location.href;
    const timestamp = new Date().toLocaleString();
    const message = `Assistance Required on ${currentPageUrl}\nRole: ${isAdmin ? "admin" : "member"}\nName: ${user?.displayName || "Unknown"}\nuid: ${user?.uid || "N/A"}\nTime: ${timestamp}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  const data = {
    versions: [],
    navMain: [
      {
        title: "Ahh shit, not you again... T_T",
        url: "/",
        items: [
          {
            title: "Send Email",
            url: "/dashboard",
          },
          {
            title: "Logs",
            url: "/dashboard/logs",
          },
          {
            title: "Need Help?",
            url: "#",
          },
        ],
      },
    ],
  };

  if (isAdmin) {
    data.navMain[0].items.push({
      title: "Manage Users",
      url: "/dashboard/manageUsers",
    });
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((navItem) => (
                  <SidebarMenuItem key={navItem.title}>
                    <SidebarMenuButton asChild>
                      {navItem.title === "Need Help?" ? (
                        <button onClick={handleNeedHelp}>{navItem.title}</button>
                      ) : (
                        <button onClick={() => router.push(navItem.url)}>{navItem.title}</button>
                      )}
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