"use client";

import { AppSidebar } from "@/components/sidebar";
import SendEmailFormSkeleton from "@/components/skeletonUI/sendEmailForm";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();

  const isMaintenanceMode =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  if (loading) {
    return <SendEmailFormSkeleton />;
  }

  if (!user) {
    redirect("/");
  }

  if (isMaintenanceMode) {
    return (
      <div className="dark:text-white flex flex-col items-center justify-center w-full h-screen p-4">
        <h1 className="text-3xl font-bold mb-4">
          Maintenance in Progress
        </h1>
        <p className="text-lg text-center">
          The app is currently unavailable due to scheduled maintenance.
          Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="dark text-white">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
