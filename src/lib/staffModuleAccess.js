/**
 * Default access when a staff row has no Permission record yet
 * (matches Prisma @default on Permission fields).
 */
export function effectiveStaffModuleAccess(perm) {
  if (!perm) {
    return {
      canAccessLedger: false,
      canAccessWalkIn: false,
      canAccessAttendance: true,
      canAccessTherapies: true,
    };
  }
  return {
    canAccessLedger: Boolean(perm.canAccessLedger),
    canAccessWalkIn: Boolean(perm.canAccessWalkIn),
    canAccessAttendance: Boolean(perm.canAccessAttendance),
    canAccessTherapies: Boolean(perm.canAccessTherapies),
  };
}
