'use client'

import { AppSidebar } from "@/components/App-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

export default function RootLayout({ children }) {
    return (
        <div className="dark dark:text-white">
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