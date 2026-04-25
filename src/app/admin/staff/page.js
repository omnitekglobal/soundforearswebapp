import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Alert from "@/components/ui/Alert";
import DeleteButton from "@/components/ui/DeleteButton";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { countAdminModulesEnabled, requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { createStaff, updateStaff, deleteStaff } from "./actions";
import StaffModuleAccessFieldset from "./StaffModuleAccessFieldset";
import {
  STAFF_MODULE_OPTIONS,
  defaultStaffModuleValues,
  ADMIN_MODULE_OPTIONS,
  defaultAdminModuleValues,
} from "./staffModuleOptions";

export const metadata = {
  title: "Staff – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const STAFF_SORT_KEYS = ["name", "phone", "isActive", "createdAt"];
const DEFAULT_ORDER = { createdAt: "desc" };

export default async function AdminStaffPage({ searchParams }) {
  await requireAdminOrStaffForModule("staff");
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;
  const editId = typeof params.edit === "string" ? params.edit : null;
  const staffToEdit = editId
    ? await prisma.staff.findUnique({
        where: { id: editId },
        include: { user: true, permissions: true },
      })
    : null;

  const { skip, take } = getSkipTake(params);
  const where = getWhere(params, {});
  const orderBy = getOrderBy(params, STAFF_SORT_KEYS, DEFAULT_ORDER);

  const [staff, totalCount] = await Promise.all([
    prisma.staff.findMany({ where, include: { permissions: true }, orderBy, skip, take }),
    prisma.staff.count({ where }),
  ]);

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
      header: "Permissions",
      render: (row) => {
        const p = row.permissions || {};
        const chips = [];
        if (p.canAccessLedger) chips.push("Ledger");
        if (p.canAccessWalkIn) chips.push("Walk-ins");
        if (p.canAccessAttendance) chips.push("Attendance");
        if (p.canAccessTherapies) chips.push("Therapies");
        if (chips.length === 0) chips.push("None");
        const nAdmin = countAdminModulesEnabled(p);
        return (
          <div className="space-y-1.5">
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
            {nAdmin > 0 && (
              <p className="text-[10px] text-slate-500">
                Admin areas: {nAdmin} enabled
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/staff?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </a>
          <DeleteButton
            action={deleteStaff.bind(null, row.id)}
            confirmMessage="Are you sure you want to delete this staff member? This cannot be undone."
          >
            Delete
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="error" title="Cannot delete staff">
          {error}
        </Alert>
      )}
      <Card
        title={staffToEdit ? "Edit staff" : "Add staff"}
        actions={
          staffToEdit ? (
            <a
              href="/admin/staff"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          ) : null
        }
      >
        <form
          action={staffToEdit ? updateStaff.bind(null, staffToEdit.id) : createStaff}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-start"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Name *
            </label>
            <input
              name="name"
              className={inputClass}
              defaultValue={staffToEdit?.name ?? ""}
              required
            />
          </div>
          {!staffToEdit && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Phone
            </label>
            <input
              name="phone"
              className={inputClass}
              defaultValue={staffToEdit?.phone ?? ""}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={staffToEdit?.isActive ?? true}
              className="h-4 w-4 rounded border-slate-300 text-sky-600"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Active
            </label>
          </div>
          <StaffModuleAccessFieldset
            sectionTitle="Staff portal (their app)"
            sectionBlurb="Controls /staff/… pages: attendance, therapies, staff ledger, walk-ins. Dashboard is always on."
            selectAllLabel="Select all"
            clearLabel="Clear all"
            options={STAFF_MODULE_OPTIONS}
            defaultValues={defaultStaffModuleValues(staffToEdit?.permissions)}
            checkboxDataAttr="data-staff-page"
          />
          <StaffModuleAccessFieldset
            sectionTitle="Clinic admin (this app, optional)"
            sectionBlurb="If any are on, this user can open /admin/… for only those areas. Use cautiously. Full “admin” role still sees everything."
            selectAllLabel="Select all admin pages"
            clearLabel="Clear all"
            options={ADMIN_MODULE_OPTIONS}
            defaultValues={defaultAdminModuleValues(staffToEdit?.permissions)}
            checkboxDataAttr="data-admin-page"
          />
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {staffToEdit ? "Update" : "Add"} staff
            </button>
          </div>
        </form>
      </Card>

      <Card title="Staff">
        <DataTable
          columns={columns}
          data={staff}
          emptyMessage="No staff members added yet."
          basePath="/admin/staff"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[{ key: "name", header: "Name" }, { key: "phone", header: "Phone" }]}
          sortableColumns={STAFF_SORT_KEYS}
        />
      </Card>
    </div>
  );
}
