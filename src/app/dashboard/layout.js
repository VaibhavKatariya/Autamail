'use client';

import { AppSidebar } from "@/components/App-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
    const { user, loading, checkingAuth } = useAuth(); // Use the hook
    const router = useRouter();

    useEffect(() => {
        // Redirect to home if not authenticated
        if (!loading && !checkingAuth && !user) {
            router.replace("/");
        }
    }, [user, loading, checkingAuth, router]);

    // Show loading state while checking authentication or user role
    if (loading || checkingAuth) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    // Render the dashboard layout if authenticated
    return (
        <div className="dark text-white">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 dark:text-white">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                    </header>
                    <main>
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}