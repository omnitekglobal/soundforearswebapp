import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Staff – Admin",
};

export default async function AdminStaffPage() {
  await requireRole(["admin"]);

  const staff = await prisma.staff.findMany({
    include: { permissions: true },
    orderBy: { createdAt: "desc" },
  });

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            row.isActive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Module Permissions",
      render: (row) => {
        const p = row.permissions || {};
        const chips = [];
        if (p.canAccessLedger) chips.push("Ledger");
        if (p.canAccessWalkIn) chips.push("Walk-ins");
        if (p.canAccessAttendance) chips.push("Attendance");
        if (chips.length === 0) chips.push("None");
        return (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 ring-1 ring-sky-100"
              >
                {chip}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Staff">
        <DataTable
          columns={columns}
          data={staff}
          emptyMessage="No staff members added yet."
        />
      </Card>
    </div>
  );
}

