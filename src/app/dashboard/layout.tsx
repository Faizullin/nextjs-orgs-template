import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/dashboard/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

/**
 * The gate for everything under `/dashboard`, and the shell it renders in.
 *
 * The guard is here rather than in middleware so it sits on the resource it
 * protects — see the note in `src/middleware.ts`.
 *
 * The sidebar's open/closed state is read from a cookie on the server, so the
 * first paint matches what the person left it as instead of flashing open and
 * snapping shut.
 */
export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
