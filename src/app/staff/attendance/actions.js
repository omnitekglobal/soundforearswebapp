"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { effectiveStaffModuleAccess } from "@/lib/staffModuleAccess";
import { getNowInClinicTz } from "@/lib/datetime";

async function getCurrentStaffIdForAttendance() {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });
  if (!staff) throw new Error("Staff record not found.");
  if (!effectiveStaffModuleAccess(staff.permissions).canAccessAttendance) {
    throw new Error("You do not have permission to manage attendance.");
  }
  return staff.id;
}

export async function createMyAttendance(formData) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffIdForAttendance();
  const now = getNowInClinicTz();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existingCount = await prisma.attendance.count({
    where: {
      staffId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (existingCount > 0) {
    const error = encodeURIComponent("You have already added your attendance for today.");
    redirect(`/staff/attendance?error=${error}`);
  }

  await prisma.attendance.create({
    data: {
      date: now,
      staffId,
      patientId: null,
      checkIn: null,
      checkOut: null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
  revalidatePath("/staff/attendance");
  redirect("/staff/attendance");
}

export async function updateMyAttendance(id, formData) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffIdForAttendance();
  const existing = await prisma.attendance.findFirst({ where: { id, staffId } });
  if (!existing) return { error: "Record not found or access denied." };

  await prisma.attendance.update({
    where: { id },
    data: {
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
  revalidatePath("/staff/attendance");
  redirect("/staff/attendance");
}

export async function deleteMyAttendance(id) {
  await requireAdminOrStaffForModule("attendance");
  if (!id) return { error: "Invalid record." };
  await prisma.attendance.delete({ where: { id } });
  revalidatePath("/admin/attendance");
  return { ok: true };
}
