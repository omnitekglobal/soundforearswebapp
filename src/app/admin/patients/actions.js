"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseDateInClinicTz } from "@/lib/datetime";

function toInt(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}

function toIntOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

export async function createPatient(formData) {
  await requireRole(["admin"]);
  const patientName = formData.get("patientName")?.toString().trim();
  if (!patientName) return { error: "Patient name is required." };

  const email = formData.get("email")?.toString().trim() || null;
  const password = formData.get("password")?.toString() || null;
  if (password && !email) {
    return { error: "Email is required when setting a portal password." };
  }

  const amount = toInt(formData.get("amount"));
  const advance = toInt(formData.get("advance"));
  const due = toInt(formData.get("due"));
  const dateVal = parseDateInClinicTz(formData.get("date"));
  const patientData = {
    patientName,
    childName: formData.get("childName")?.toString().trim() || null,
    age: toInt(formData.get("age")),
    sex: formData.get("sex")?.toString().trim() || "OTHER",
    services: formData.get("services")?.toString().trim() || "",
    amount,
    advance,
    due,
    noOfSessions: toIntOrNull(formData.get("noOfSessions")),
    date: dateVal ?? undefined,
    phone: formData.get("phone")?.toString().trim() || null,
    email,
  };

  let patient;
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "A user with this email already exists." };

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "patient",
        patient: {
          create: patientData,
        },
      },
      include: { patient: true },
    });
    patient = user.patient;
  } else {
    patient = await prisma.patient.create({
      data: patientData,
    });
  }

  await prisma.ledger.create({
    data: {
      patientId: patient.id,
      date: dateVal ?? new Date(),
      description: `Patient registration – ${patientName}`,
      cr: amount,
      advance,
      due,
    },
  });

  revalidatePath("/admin/patients");
  revalidatePath("/admin/ledger");
  return { ok: true };
}

export async function updatePatient(id, formData) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid patient." };
  const patientName = formData.get("patientName")?.toString().trim();
  if (!patientName) return { error: "Patient name is required." };

  const dateVal = parseDateInClinicTz(formData.get("date"));

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
      noOfSessions: toIntOrNull(formData.get("noOfSessions")),
      date: dateVal ?? undefined,
      phone: formData.get("phone")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
    },
  });
  revalidatePath("/admin/patients");
  redirect("/admin/patients");
}

export async function deletePatient(id) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid patient." };
  const [attendanceCount, therapyCount, ledgerCount] = await Promise.all([
    prisma.attendance.count({ where: { patientId: id } }),
    prisma.therapyAssignment.count({ where: { patientId: id } }),
    prisma.ledger.count({ where: { patientId: id } }),
  ]);

  if (attendanceCount > 0 || therapyCount > 0 || ledgerCount > 0) {
    const reasons = [];
    if (attendanceCount > 0) reasons.push(`${attendanceCount} attendance record(s)`);
    if (therapyCount > 0) reasons.push(`${therapyCount} therapy assignment(s)`);
    if (ledgerCount > 0) reasons.push(`${ledgerCount} ledger entr${ledgerCount === 1 ? "y" : "ies"}`);
    const message =
      reasons.length === 0
        ? "Patient has related records. Please remove those records first."
        : `Patient has related records: ${reasons.join(
            ", "
          )}. Please remove those records first.`;
    const error = encodeURIComponent(message);
    redirect(`/admin/patients?error=${error}`);
  }

  await prisma.patient.delete({ where: { id } });
  revalidatePath("/admin/patients");
  return { ok: true };
}
