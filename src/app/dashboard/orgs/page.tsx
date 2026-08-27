import { OrganizationList } from "@/features/organizations/client";

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <p className="text-muted-foreground text-sm">
          Every organization you belong to, and your role in each.
        </p>
      </div>
      <OrganizationList />
    </div>
  );
}
