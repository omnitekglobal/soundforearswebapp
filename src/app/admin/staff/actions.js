"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { readPermissionFieldsFromForm } from "./staffModuleOptions";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";

export async function createStaff(formData) {
  await requireAdminOrStaffForModule("staff");
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString().trim();
  if (!email || !password || !name) return { error: "Email, password and name are required." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "staff",
      staff: {
        create: {
          name,
          phone: formData.get("phone")?.toString().trim() || null,
          isActive: formData.get("isActive") === "on",
          permissions: {
            create: readPermissionFieldsFromForm(formData),
          },
        },
      },
    },
  });
  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function updateStaff(id, formData) {
  await requireAdminOrStaffForModule("staff");
  if (!id) return { error: "Invalid staff." };

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { permissions: true },
  });
  if (!staff) return { error: "Staff not found." };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required." };

  await prisma.staff.update({
    where: { id },
    data: {
      name,
      phone: formData.get("phone")?.toString().trim() || null,
      isActive: formData.get("isActive") === "on",
    },
  });

  const perms = readPermissionFieldsFromForm(formData);
  if (staff.permissions) {
    await prisma.permission.update({
      where: { id: staff.permissions.id },
      data: perms,
    });
  } else {
    await prisma.permission.create({
      data: { staffId: id, ...perms },
    });
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(id) {
  await requireAdminOrStaffForModule("staff");
  if (!id) return { error: "Invalid staff." };

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return { error: "Staff not found." };

  const [attendanceCount, therapyCount] = await Promise.all([
    prisma.attendance.count({ where: { staffId: id } }),
    prisma.therapyAssignment.count({ where: { staffId: id } }),
  ]);

  if (attendanceCount > 0 || therapyCount > 0) {
    const error = encodeURIComponent(
      "Staff member has related attendance or therapy assignments. Please reassign or remove those records first."
    );
    redirect(`/admin/staff?error=${error}`);
  }

  await prisma.permission.deleteMany({ where: { staffId: id } });
  await prisma.staff.delete({ where: { id } });
  await prisma.user.delete({ where: { id: staff.userId } });
  revalidatePath("/admin/staff");
  return { ok: true };
}
