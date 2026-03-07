"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseDateTimeInClinicTz } from "@/lib/datetime";

export async function createAttendance(formData) {
  await requireRole(["admin"]);
  const date = parseDateTimeInClinicTz(formData.get("date"));
  if (!date) return { error: "Date & time is required." };

  await prisma.attendance.create({
    data: {
      date,
      staffId: formData.get("staffId")?.toString().trim() || null,
      patientId: formData.get("patientId")?.toString().trim() || null,
      checkIn: parseDateTimeInClinicTz(formData.get("checkIn")) || null,
      checkOut: parseDateTimeInClinicTz(formData.get("checkOut")) || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
  revalidatePath("/admin/attendance");
  return { ok: true };
}

export async function updateAttendance(id, formData) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid record." };
  const date = parseDateTimeInClinicTz(formData.get("date"));
  if (!date) return { error: "Date & time is required." };

  await prisma.attendance.update({
    where: { id },
    data: {
      date,
      staffId: formData.get("staffId")?.toString().trim() || null,
      patientId: formData.get("patientId")?.toString().trim() || null,
      checkIn: parseDateTimeInClinicTz(formData.get("checkIn")) || null,
      checkOut: parseDateTimeInClinicTz(formData.get("checkOut")) || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
  revalidatePath("/admin/attendance");
  redirect("/admin/attendance");
}

export async function deleteAttendance(id) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid record." };
  await prisma.attendance.delete({ where: { id } });
  revalidatePath("/admin/attendance");
  return { ok: true };
}
