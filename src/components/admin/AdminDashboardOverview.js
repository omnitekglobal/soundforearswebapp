import Card from "@/components/ui/Card";

export default function AdminDashboardOverview() {
  return (
    <div className="space-y-4">
      <Card title="Admin Dashboard">
        <p className="text-sm text-slate-700">
          Welcome, clinic admin. From here you will manage patients, staff,
          attendance, ledger and daily walk-ins.
        </p>
      </Card>
    </div>
  );
}

