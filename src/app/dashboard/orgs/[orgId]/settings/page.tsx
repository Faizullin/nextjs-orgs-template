import { OrganizationSettingsPanel } from "@/features/organizations/client";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationSettingsPanel organizationId={Number(orgId)} />;
}
