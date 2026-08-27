import { notFound } from "next/navigation";
import { ReactNode } from "react";

/**
 * Validates the route param and nothing else. Membership is checked by the
 * procedures each page calls — a layout that also queried would make the same
 * check twice and let the two disagree.
 */
export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  if (!/^\d+$/.test(orgId)) {
    notFound();
  }
  return <>{children}</>;
}
