import { OrganizationOverview } from "@/features/organizations/client";

export default async function OrganizationOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationOverview organizationId={Number(orgId)} />;
}
