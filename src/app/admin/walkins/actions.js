"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { parseDateInClinicTz } from "@/lib/datetime";

function parseDate(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return new Date();
  return parseDateInClinicTz(s) ?? new Date();
}

export async function createWalkIn(formData) {
  await requireAdminOrStaffForModule("walkins");
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
  revalidatePath("/admin/walkins");
  return { ok: true };
}

export async function updateWalkIn(id, formData) {
  await requireAdminOrStaffForModule("walkins");
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
  revalidatePath("/admin/walkins");
  redirect("/admin/walkins");
}

export async function deleteWalkIn(id) {
  await requireAdminOrStaffForModule("walkins");
  if (!id) return { error: "Invalid walk-in." };
  await prisma.walkIn.delete({ where: { id } });
  revalidatePath("/admin/walkins");
  return { ok: true };
}
