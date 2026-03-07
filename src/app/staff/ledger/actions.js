"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
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

async function ensureLedgerPermission() {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });
  if (!staff?.permissions?.canAccessLedger && session.role !== "admin")
    throw new Error("You do not have permission to manage the ledger.");
}

export async function createLedgerEntry(formData) {
  await requireRole(["admin", "staff"]);
  await ensureLedgerPermission();
  const description = formData.get("description")?.toString().trim();
  if (!description) return { error: "Description is required." };

  await prisma.ledger.create({
    data: {
      date: parseDate(formData.get("date")),
      patientId: formData.get("patientId")?.toString().trim() || null,
      description,
      income: toInt(formData.get("income")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
      expense: toInt(formData.get("expense")),
    },
  });
  revalidatePath("/staff/ledger");
  revalidatePath("/admin/ledger");
  redirect("/staff/ledger");
}

export async function updateLedgerEntry(id, formData) {
  await requireRole(["admin", "staff"]);
  await ensureLedgerPermission();
  if (!id) return { error: "Invalid entry." };
  const description = formData.get("description")?.toString().trim();
  if (!description) return { error: "Description is required." };

  await prisma.ledger.update({
    where: { id },
    data: {
      date: parseDate(formData.get("date")),
      patientId: formData.get("patientId")?.toString().trim() || null,
      description,
      income: toInt(formData.get("income")),
      advance: toInt(formData.get("advance")),
      due: toInt(formData.get("due")),
      expense: toInt(formData.get("expense")),
    },
  });
  revalidatePath("/staff/ledger");
  revalidatePath("/admin/ledger");
  redirect("/staff/ledger");
}

export async function deleteLedgerEntry(id) {
  await requireRole(["admin", "staff"]);
  await ensureLedgerPermission();
  if (!id) return { error: "Invalid entry." };
  await prisma.ledger.delete({ where: { id } });
  revalidatePath("/staff/ledger");
  revalidatePath("/admin/ledger");
  return { ok: true };
}
