import * as React from "react"
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function VersionSwitcher({
  versions,
  defaultVersion
}) {
  const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion)

  return (
    (<SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg">
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <img src="https://icons.iconarchive.com/icons/dtafalonso/win-10x/128/Email-icon.png" width="128" height="128"/>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-bold text-xl">Autamail</span>
              
              </div>
             
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>)
  );
}
