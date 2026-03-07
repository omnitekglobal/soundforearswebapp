"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { getNowInClinicTz, parseTimeTodayInClinicTz } from "@/lib/datetime";

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

  await prisma.attendance.create({
    data: {
      date: now,
      patientId,
      checkIn: parseTimeTodayInClinicTz(formData.get("checkIn")) || null,
      checkOut: parseTimeTodayInClinicTz(formData.get("checkOut")) || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
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

  await prisma.attendance.update({
    where: { id },
    data: {
      checkIn: parseTimeTodayInClinicTz(formData.get("checkIn")) || null,
      checkOut: parseTimeTodayInClinicTz(formData.get("checkOut")) || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
  revalidatePath("/patient/attendance");
  redirect("/patient/attendance");
}

export async function deleteMyAttendance(id) {
  await requireRole(["patient"]);
  const patientId = await getCurrentPatientId();
  const existing = await prisma.attendance.findFirst({ where: { id, patientId } });
  if (!existing) return { error: "Record not found or access denied." };
  if (!isToday(new Date(existing.date))) return { error: "You can only delete today's attendance." };
  await prisma.attendance.delete({ where: { id } });
  revalidatePath("/patient/attendance");
  return { ok: true };
}
