"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavGroup, NavMainItem } from "@/config/nav-items";

/**
 * Renders any `NavGroup[]` — the account nav and every organization nav go
 * through this one component, which is the point of keeping the nav as data.
 *
 * Active state is derived from the pathname, so it survives a deep link and a
 * hard refresh with nothing to keep in sync. A collapsed sidebar swaps
 * submenus for dropdowns, because a nested list has nowhere to go at icon
 * width.
 */

const ComingSoon = () => (
  <span className="bg-muted text-muted-foreground ml-auto rounded-md px-2 py-0.5 text-xs">
    Soon
  </span>
);

export function NavMain({ items }: { readonly items: readonly NavGroup[] }) {
  const path = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const isItemActive = (item: NavMainItem) => {
    if (item.subItems?.length) {
      return item.subItems.some((sub) => path.startsWith(sub.url));
    }
    return path === item.url;
  };

  const isSubmenuOpen = (item: NavMainItem) =>
    item.subItems?.some((sub) => path.startsWith(sub.url)) ?? false;

  return (
    <>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                // Leaf item — a plain link at every width.
                if (!item.subItems?.length) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        aria-disabled={item.comingSoon}
                        tooltip={item.title}
                        isActive={isItemActive(item)}
                      >
                        <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.comingSoon && <ComingSoon />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                if (isCollapsed) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            disabled={item.comingSoon}
                            tooltip={item.title}
                            isActive={isItemActive(item)}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight />
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-50">
                          {item.subItems.map((subItem) => (
                            <DropdownMenuItem key={subItem.title} asChild>
                              <Link
                                href={subItem.url}
                                target={subItem.newTab ? "_blank" : undefined}
                              >
                                {subItem.icon && <subItem.icon />}
                                <span>{subItem.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isSubmenuOpen(item)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          disabled={item.comingSoon}
                          isActive={isItemActive(item)}
                          tooltip={item.title}
                        >
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.comingSoon && <ComingSoon />}
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={path === subItem.url}>
                                <Link
                                  href={subItem.url}
                                  target={subItem.newTab ? "_blank" : undefined}
                                >
                                  {subItem.icon && <subItem.icon />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
