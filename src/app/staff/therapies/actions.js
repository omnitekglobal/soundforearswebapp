"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { parseDateTimeInClinicTz } from "@/lib/datetime";

async function getCurrentStaffId() {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({ where: { userId: session.userId } });
  if (!staff) throw new Error("Staff record not found.");
  return staff.id;
}

export async function createMyTherapyAssignment(formData) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffId();
  const patientId = formData.get("patientId")?.toString().trim();
  const service = formData.get("service")?.toString().trim();
  const startTime = parseDateTimeInClinicTz(formData.get("startTime"));
  const endTime = parseDateTimeInClinicTz(formData.get("endTime"));
  if (!patientId || !service || !startTime || !endTime)
    return { error: "Patient, service, start and end time are required." };

  await prisma.therapyAssignment.create({
    data: {
      staffId,
      patientId,
      service,
      startTime,
      endTime,
      status: formData.get("status")?.toString().trim() || "SCHEDULED",
    },
  });
  revalidatePath("/staff/therapies");
  redirect("/staff/therapies");
}

export async function updateMyTherapyAssignment(id, formData) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffId();
  const existing = await prisma.therapyAssignment.findFirst({ where: { id, staffId } });
  if (!existing) return { error: "Assignment not found or access denied." };

  const patientId = formData.get("patientId")?.toString().trim();
  const service = formData.get("service")?.toString().trim();
  const startTime = parseDateTimeInClinicTz(formData.get("startTime"));
  const endTime = parseDateTimeInClinicTz(formData.get("endTime"));
  if (!patientId || !service || !startTime || !endTime)
    return { error: "Patient, service, start and end time are required." };

  await prisma.therapyAssignment.update({
    where: { id },
    data: {
      patientId,
      service,
      startTime,
      endTime,
      status: formData.get("status")?.toString().trim() || "SCHEDULED",
    },
  });
  revalidatePath("/staff/therapies");
  redirect("/staff/therapies");
}

export async function deleteMyTherapyAssignment(id) {
  await requireRole(["staff"]);
  const staffId = await getCurrentStaffId();
  const existing = await prisma.therapyAssignment.findFirst({ where: { id, staffId } });
  if (!existing) return { error: "Assignment not found or access denied." };
  await prisma.therapyAssignment.delete({ where: { id } });
  revalidatePath("/staff/therapies");
  return { ok: true };
}
