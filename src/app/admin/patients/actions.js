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
    const error = encodeURIComponent(
      "Email is required when setting a portal password."
    );
    redirect(`/admin/patients?error=${error}`);
  }

  const amount = toInt(formData.get("amount"));
  const advance = toInt(formData.get("advance"));
  const due = toInt(formData.get("due"));
  const dateVal = parseDateInClinicTz(formData.get("date"));
  const patientType =
    formData.get("patientType")?.toString().trim() || "therapy";
  const patientData = {
    patientName,
    childName: null,
    age: toInt(formData.get("age")),
    sex: formData.get("sex")?.toString().trim() || "OTHER",
    services: formData.get("services")?.toString().trim() || "",
    amount,
    perSessionCharge: toIntOrNull(formData.get("perSessionCharge")),
    advance,
    due,
    noOfSessions: toIntOrNull(formData.get("noOfSessions")),
    date: dateVal ?? undefined,
    phone: formData.get("phone")?.toString().trim() || null,
    email,
    address: formData.get("address")?.toString().trim() || null,
    patientType,
  };

  let patient;
  try {
    if (email && password) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        const error = encodeURIComponent(
          "A user with this email already exists."
        );
        redirect(`/admin/patients?error=${error}`);
      }

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
  } catch (err) {
    console.error("Error creating patient", err);

    let message = "Could not create patient. Please try again.";

    const rawMessage = typeof err?.message === "string" ? err.message : "";

    if (
      email &&
      typeof err?.code === "string" &&
      (err.code === "P2002" || err.code === "P2003")
    ) {
      message = "A user with this email already exists.";
    } else if (rawMessage && !rawMessage.startsWith("NEXT_REDIRECT")) {
      // Surface a more specific Prisma / DB error when available,
      // but avoid leaking Next.js internal redirect marker / URL blob.
      const existsMsg = "A user with this email already exists.";
      message = rawMessage.includes(existsMsg) ? existsMsg : rawMessage;
    }

    const error = encodeURIComponent(message);
    redirect(`/admin/patients?error=${error}`);
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
      childName: null,
      age: toInt(formData.get("age")),
      sex: formData.get("sex")?.toString().trim() || "OTHER",
      services: formData.get("services")?.toString().trim() || "",
      amount: toInt(formData.get("amount")),
      perSessionCharge: toIntOrNull(formData.get("perSessionCharge")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
      noOfSessions: toIntOrNull(formData.get("noOfSessions")),
      date: dateVal ?? undefined,
      phone: formData.get("phone")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      address: formData.get("address")?.toString().trim() || null,
      patientType:
        formData.get("patientType")?.toString().trim() || undefined,
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
