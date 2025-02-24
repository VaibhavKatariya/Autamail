'use client';

import { AppSidebar } from "@/components/App-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({ children }) {
    const { user, loading, isAdmin, checkingAuth } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === "undefined") return; // Prevents issues during SSR

        if (user && isAdmin && pathname.startsWith("/u/")) {
            const newPath = pathname.replace("/u/", "/admin/");
            router.replace(newPath); // Use replace instead of push to avoid stacking history
        }
    }, [user, isAdmin, pathname, router]);

    useEffect(() => {
        if (!loading && !checkingAuth) {
            if (!user) {
                router.replace("/");
            } else if (!isAdmin && !pathname.startsWith("/admin/")) {
                router.replace("/u/dashboard");
            }
        }
    }, [user, isAdmin, loading, checkingAuth, pathname, router]);

    if (loading || checkingAuth) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
