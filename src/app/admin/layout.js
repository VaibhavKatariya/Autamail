'use client';

import { AppSidebar } from "@/components/App-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({ children }) {
    const { user, loading, isAdmin, checkingAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect if the user is an admin and is trying to access a user route
        if (user && isAdmin && window.location.pathname.startsWith('/u/')) {
            const newPath = window.location.pathname.replace('/u/', '/admin/');
            router.push(newPath);
        }
    }, [user, isAdmin, router]);

    if (loading || checkingAuth) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        router.push("/");
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
    } else if (!isAdmin) {
        router.push("/u/dashboard");
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
    }

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
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
