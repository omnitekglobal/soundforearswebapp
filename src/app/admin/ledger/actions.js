"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseDateInClinicTz } from "@/lib/datetime";

function toInt(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}

function parseDate(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return new Date();
  return parseDateInClinicTz(s) ?? new Date();
}

export async function createLedgerEntry(formData) {
  await requireRole(["admin"]);
  const description = formData.get("description")?.toString().trim();
  if (!description) return { error: "Description is required." };

  await prisma.ledger.create({
    data: {
      date: parseDate(formData.get("date")),
      patientId: formData.get("patientId")?.toString().trim() || null,
      description,
      cr: toInt(formData.get("cr")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
      dr: toInt(formData.get("dr")),
    },
  });
  revalidatePath("/admin/ledger");
  return { ok: true };
}

export async function updateLedgerEntry(id, formData) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid entry." };
  const description = formData.get("description")?.toString().trim();
  if (!description) return { error: "Description is required." };

  await prisma.ledger.update({
    where: { id },
    data: {
      date: parseDate(formData.get("date")),
      patientId: formData.get("patientId")?.toString().trim() || null,
      description,
      cr: toInt(formData.get("cr")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
      dr: toInt(formData.get("dr")),
    },
  });
  revalidatePath("/admin/ledger");
  redirect("/admin/ledger");
}

export async function deleteLedgerEntry(id) {
  await requireRole(["admin"]);
  if (!id) return { error: "Invalid entry." };
  await prisma.ledger.delete({ where: { id } });
  revalidatePath("/admin/ledger");
  return { ok: true };
}
