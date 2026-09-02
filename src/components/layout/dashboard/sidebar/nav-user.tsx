"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { EllipsisVertical, LogOut, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return (
    trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** The signed-in person, in the sidebar footer. Identity comes from Clerk. */
export function NavUser() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const display = useMemo(
    () => ({
      name: user?.fullName || user?.username || "Account",
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      avatar: user?.imageUrl ?? "",
    }),
    [user]
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={display.avatar} alt={display.name} />
              <AvatarFallback className="rounded-lg">{initials(display.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{display.name}</span>
              <span className="text-muted-foreground truncate text-xs">{display.email}</span>
            </div>
            <EllipsisVertical className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Base UI's GroupLabel reads MenuGroupContext, so a label must sit
                inside a Group — Radix had no such requirement. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {display.email || "Signed in"}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openUserProfile()}>
              <UserCog className="size-4" />
              Manage account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut(() => router.push("/"))}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
