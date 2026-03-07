import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function getUserByEmail(email) {
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email },
    include: {
      staff: {
        include: {
          permissions: true,
        },
      },
      patient: true,
    },
  });
}

export async function verifyUserCredentials(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return user;
}

