"use client";

import NiceModal from "@ebay/nice-modal-react";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { OrganizationDialog } from "./organization-dialog";

/**
 * The organization switcher, in the sidebar header.
 *
 * The current organization comes from the **route**, not from state, so a
 * deep link shows the right one on first paint and there is nothing to keep
 * in sync. Outside an organization it falls back to the product name, so the
 * header never changes height or disappears between pages.
 */
export function OrganizationSwitcher() {
  const params = useParams<{ orgId?: string }>();
  const { isMobile } = useSidebar();

  const organizationId = params?.orgId ? Number(params.orgId) : undefined;
  const organizations = trpc.organization.listMine.useQuery(undefined, {
    // The shell renders on every page; refetching this on each navigation is
    // noise.
    staleTime: 60_000,
  });

  const current = organizationId
    ? organizations.data?.find((o) => o.id === organizationId)
    : undefined;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              {organizations.isLoading && organizationId ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <>
                  <span className="truncate font-semibold">{current?.name ?? "Dashboard"}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {current ? "Organization" : "All organizations"}
                  </span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>

            {organizations.data?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="gap-2 p-2"
                render={<Link href={`/dashboard/orgs/${org.id}`} />}
              >
                <span className="flex-1 truncate">{org.name}</span>
                {org.id === organizationId && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}

            {organizations.data?.length === 0 && (
              <p className="text-muted-foreground p-2 text-xs">No organizations yet.</p>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onSelect={() => NiceModal.show(OrganizationDialog, { mode: "create" })}
            >
              <Plus className="size-4" />
              <span>New organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
