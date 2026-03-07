"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function toInt(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}

export async function createPatient(formData) {
  await requireRole(["admin"]);
  const patientName = formData.get("patientName")?.toString().trim();
  if (!patientName) return { error: "Patient name is required." };

  await prisma.patient.create({
    data: {
      patientName,
      childName: formData.get("childName")?.toString().trim() || null,
      age: toInt(formData.get("age")),
      sex: formData.get("sex")?.toString().trim() || "OTHER",
      services: formData.get("services")?.toString().trim() || "",
      amount: toInt(formData.get("amount")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
    },
  });
  revalidatePath("/admin/patients");
  return { ok: true };
}

export async function updatePatient(id, formData) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid patient." };
  const patientName = formData.get("patientName")?.toString().trim();
  if (!patientName) return { error: "Patient name is required." };

  await prisma.patient.update({
    where: { id },
    data: {
      patientName,
      childName: formData.get("childName")?.toString().trim() || null,
      age: toInt(formData.get("age")),
      sex: formData.get("sex")?.toString().trim() || "OTHER",
      services: formData.get("services")?.toString().trim() || "",
      amount: toInt(formData.get("amount")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
    },
  });
  revalidatePath("/admin/patients");
  redirect("/admin/patients");
}

export async function deletePatient(id) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid patient." };
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/admin/patients");
  return { ok: true };
}
