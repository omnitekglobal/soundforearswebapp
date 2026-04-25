/** Staff portal areas (excludes dashboard). */
export const STAFF_MODULE_OPTIONS = [
  {
    name: "canAccessAttendance",
    label: "Attendance",
    blurb: "Log and review own check-ins / daily attendance.",
  },
  {
    name: "canAccessTherapies",
    label: "Therapies",
    blurb: "Therapy sessions, schedule, and assignments.",
  },
  {
    name: "canAccessLedger",
    label: "Ledger",
    blurb: "Patient financial ledger and related entries.",
  },
  {
    name: "canAccessWalkIn",
    label: "Walk-ins",
    blurb: "Register and browse visitor walk-ins.",
  },
];

export function defaultStaffModuleValues(permissions) {
  if (!permissions) {
    return {
      canAccessAttendance: true,
      canAccessTherapies: true,
      canAccessLedger: false,
      canAccessWalkIn: false,
    };
  }
  return {
    canAccessAttendance: Boolean(permissions.canAccessAttendance),
    canAccessTherapies: Boolean(permissions.canAccessTherapies),
    canAccessLedger: Boolean(permissions.canAccessLedger),
    canAccessWalkIn: Boolean(permissions.canAccessWalkIn),
  };
}

/** Optional access to this app’s admin app routes (for users with the Staff role). */
export const ADMIN_MODULE_OPTIONS = [
  {
    name: "canAccessAdminDashboard",
    label: "Admin dashboard",
    blurb: "Overview, stats, and quick links in the admin area.",
  },
  {
    name: "canAccessAdminNormalPatients",
    label: "Normal patients",
    blurb: "List and manage normal (non–speech therapy) patients.",
  },
  {
    name: "canAccessAdminSpeechPatients",
    label: "Speech therapy patients",
    blurb: "Speech therapy patient list, registration, and patient wallet.",
  },
  {
    name: "canAccessAdminStaff",
    label: "Staff & permissions",
    blurb: "Add staff, passwords, and both staff-portal and admin access.",
  },
  {
    name: "canAccessAdminAttendance",
    label: "Admin attendance",
    blurb: "Clinic-wide attendance (all people).",
  },
  {
    name: "canAccessAdminTherapies",
    label: "Admin therapies",
    blurb: "Schedule and manage all therapy assignments.",
  },
  {
    name: "canAccessAdminSales",
    label: "Sales (ledger)",
    blurb: "Record sales in the admin ledger / sales view.",
  },
  {
    name: "canAccessAdminPayouts",
    label: "Payouts (ledger)",
    blurb: "Record payouts in the admin ledger / payouts view.",
  },
  {
    name: "canAccessAdminLedger",
    label: "Full ledger",
    blurb: "Main admin financial ledger (all entries).",
  },
  {
    name: "canAccessAdminWalkins",
    label: "Admin walk-ins",
    blurb: "Manage the clinic walk-in register (admin).",
  },
];

export function defaultAdminModuleValues(permissions) {
  if (!permissions) {
    return Object.fromEntries(
      ADMIN_MODULE_OPTIONS.map((m) => [m.name, false])
    );
  }
  return Object.fromEntries(
    ADMIN_MODULE_OPTIONS.map((m) => [m.name, Boolean(permissions[m.name])])
  );
}

const PERMISSION_FIELD_NAMES = [
  ...STAFF_MODULE_OPTIONS.map((m) => m.name),
  ...ADMIN_MODULE_OPTIONS.map((m) => m.name),
];

/**
 * @param {import("next/server").formData} formData
 */
export function readPermissionFieldsFromForm(formData) {
  const o = {};
  for (const name of PERMISSION_FIELD_NAMES) {
    o[name] = formData.get(name) === "on";
  }
  return o;
}
