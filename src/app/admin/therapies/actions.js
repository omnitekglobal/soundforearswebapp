"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { parseDateTimeInClinicTz } from "@/lib/datetime";

export async function createTherapyAssignment(formData) {
  await requireAdminOrStaffForModule("therapies");
  const staffId = formData.get("staffId")?.toString().trim();
  const patientId = formData.get("patientId")?.toString().trim();
  const service = formData.get("service")?.toString().trim();
  const startTime = parseDateTimeInClinicTz(formData.get("startTime"));
  const endTime = parseDateTimeInClinicTz(formData.get("endTime"));
  if (!staffId || !patientId || !service || !startTime || !endTime)
    return { error: "Staff, patient, service, start and end time are required." };

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
  revalidatePath("/admin/therapies");
  revalidatePath("/staff/therapies");
  redirect("/admin/therapies");
}

export async function updateTherapyAssignment(id, formData) {
  await requireAdminOrStaffForModule("therapies");
  if (!id) return { error: "Invalid assignment." };
  const staffId = formData.get("staffId")?.toString().trim();
  const patientId = formData.get("patientId")?.toString().trim();
  const service = formData.get("service")?.toString().trim();
  const startTime = parseDateTimeInClinicTz(formData.get("startTime"));
  const endTime = parseDateTimeInClinicTz(formData.get("endTime"));
  if (!staffId || !patientId || !service || !startTime || !endTime)
    return { error: "Staff, patient, service, start and end time are required." };

  await prisma.therapyAssignment.update({
    where: { id },
    data: {
      staffId,
      patientId,
      service,
      startTime,
      endTime,
      status: formData.get("status")?.toString().trim() || "SCHEDULED",
    },
  });
  revalidatePath("/admin/therapies");
  revalidatePath("/staff/therapies");
  redirect("/admin/therapies");
}

export async function deleteTherapyAssignment(id) {
  await requireAdminOrStaffForModule("therapies");
  if (!id) return { error: "Invalid assignment." };
  await prisma.therapyAssignment.delete({ where: { id } });
  revalidatePath("/admin/therapies");
  revalidatePath("/staff/therapies");
  return { ok: true };
}
