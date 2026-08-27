import { CurrentUserCard } from "@/features/identity/client/current-user-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm">Your account and the org you work in.</p>
      </div>
      <CurrentUserCard />
    </div>
  );
}
