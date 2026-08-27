import { OrganizationMembersPanel } from "@/features/organizations/client";

export default async function OrganizationMembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationMembersPanel organizationId={Number(orgId)} />;
}
