"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { effectiveStaffModuleAccess } from "@/lib/staffModuleAccess";
import { parseDateInClinicTz } from "@/lib/datetime";

function parseDate(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return new Date();
  return parseDateInClinicTz(s) ?? new Date();
}

async function ensureWalkInPermission() {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });
  if (!effectiveStaffModuleAccess(staff?.permissions).canAccessWalkIn && session.role !== "admin")
    throw new Error("You do not have permission to manage walk-ins.");
}

export async function createWalkIn(formData) {
  await requireRole(["admin", "staff"]);
  await ensureWalkInPermission();
  const name = formData.get("name")?.toString().trim();
  const purpose = formData.get("purpose")?.toString().trim();
  if (!name || !purpose) return { error: "Name and purpose are required." };

  await prisma.walkIn.create({
    data: {
      name,
      phone: formData.get("phone")?.toString().trim() || null,
      purpose,
      place: formData.get("place")?.toString().trim() || null,
      date: parseDate(formData.get("date")),
    },
  });
  revalidatePath("/staff/walkins");
  revalidatePath("/admin/walkins");
  redirect("/staff/walkins");
}

export async function updateWalkIn(id, formData) {
  await requireRole(["admin", "staff"]);
  await ensureWalkInPermission();
  if (!id) return { error: "Invalid walk-in." };
  const name = formData.get("name")?.toString().trim();
  const purpose = formData.get("purpose")?.toString().trim();
  if (!name || !purpose) return { error: "Name and purpose are required." };

  await prisma.walkIn.update({
    where: { id },
    data: {
      name,
      phone: formData.get("phone")?.toString().trim() || null,
      purpose,
      place: formData.get("place")?.toString().trim() || null,
      date: parseDate(formData.get("date")),
    },
  });
  revalidatePath("/staff/walkins");
  revalidatePath("/admin/walkins");
  redirect("/staff/walkins");
}

export async function deleteWalkIn(id) {
  await requireRole(["admin", "staff"]);
  await ensureWalkInPermission();
  if (!id) return { error: "Invalid walk-in." };
  await prisma.walkIn.delete({ where: { id } });
  revalidatePath("/staff/walkins");
  revalidatePath("/admin/walkins");
  return { ok: true };
}
