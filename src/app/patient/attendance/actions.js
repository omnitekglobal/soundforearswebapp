"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { getNowInClinicTz, parseTimeTodayInClinicTz } from "@/lib/datetime";
import {
  createAutoSessionDebitForAttendance,
  deleteAutoSessionDebitForAttendance,
} from "@/lib/billing";

function isToday(d) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

async function getCurrentPatientId() {
  const session = await requireSession();
  const patient = await prisma.patient.findFirst({ where: { userId: session.userId } });
  if (!patient) throw new Error("Patient record not found.");
  return patient.id;
}

export async function createMyAttendance(formData) {
  await requireRole(["patient"]);
  const patientId = await getCurrentPatientId();
  const now = getNowInClinicTz();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existingCount = await prisma.attendance.count({
    where: {
      patientId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (existingCount > 0) {
    const error = encodeURIComponent("You have already added attendance for today.");
    redirect(`/patient/attendance?error=${error}`);
  }

  const attendance = await prisma.attendance.create({
    data: {
      date: now,
      patientId,
      checkIn: parseTimeTodayInClinicTz(formData.get("checkIn")) || null,
      checkOut: parseTimeTodayInClinicTz(formData.get("checkOut")) || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });

  await createAutoSessionDebitForAttendance(attendance);
  revalidatePath("/patient/attendance");
  redirect("/patient/attendance");
}

export async function updateMyAttendance(id, formData) {
  await requireRole(["patient"]);
  const patientId = await getCurrentPatientId();
  const existing = await prisma.attendance.findFirst({ where: { id, patientId } });
  if (!existing) return { error: "Record not found or access denied." };
  const recordDate = new Date(existing.date);
  if (!isToday(recordDate)) return { error: "You can only edit today's attendance." };

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      checkIn: parseTimeTodayInClinicTz(formData.get("checkIn")) || null,
      checkOut: parseTimeTodayInClinicTz(formData.get("checkOut")) || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });

  // Keep automatic session debit entry in sync (no-op if already correct)
  await deleteAutoSessionDebitForAttendance(id);
  await createAutoSessionDebitForAttendance(updated);
  revalidatePath("/patient/attendance");
  redirect("/patient/attendance");
}

export async function deleteMyAttendance(id) {
  await requireAdminOrStaffForModule("attendance");
  if (!id) return { error: "Invalid record." };
  await deleteAutoSessionDebitForAttendance(id);
  await prisma.attendance.delete({ where: { id } });
  revalidatePath("/admin/attendance");
  return { ok: true };
}
