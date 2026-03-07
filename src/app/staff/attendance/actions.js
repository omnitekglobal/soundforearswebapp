"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { getNowInClinicTz } from "@/lib/datetime";

async function getCurrentStaffId() {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({ where: { userId: session.userId } });
  if (!staff) throw new Error("Staff record not found.");
  return staff.id;
}

export async function createMyAttendance(formData) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffId();

  await prisma.attendance.create({
    data: {
      date: getNowInClinicTz(),
      staffId,
      patientId: formData.get("patientId")?.toString().trim() || null,
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
  const staffId = await getCurrentStaffId();
  const existing = await prisma.attendance.findFirst({ where: { id, staffId } });
  if (!existing) return { error: "Record not found or access denied." };

  await prisma.attendance.update({
    where: { id },
    data: {
      patientId: formData.get("patientId")?.toString().trim() || null,
      notes: formData.get("notes")?.toString().trim() || null,
    },
  });
  revalidatePath("/staff/attendance");
  redirect("/staff/attendance");
}

export async function deleteMyAttendance(id) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffId();
  const existing = await prisma.attendance.findFirst({ where: { id, staffId } });
  if (!existing) return { error: "Record not found or access denied." };
  await prisma.attendance.delete({ where: { id } });
  revalidatePath("/staff/attendance");
  return { ok: true };
}
