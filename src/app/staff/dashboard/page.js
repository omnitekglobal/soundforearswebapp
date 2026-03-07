import Card from "@/components/ui/Card";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Staff Dashboard",
};

export default async function StaffDashboardPage() {
  await requireRole(["staff"]);

  return (
    <div className="space-y-4">
      <Card title="Staff Dashboard">
        <p className="text-sm text-slate-700">
          View today&apos;s schedule, attendance and assigned therapies here.
        </p>
      </Card>
    </div>
  );
}

