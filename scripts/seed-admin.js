// Seed initial users (admin, staff, patient) so you can log in.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminEmail = "admin@soundforears.test";
  const adminPassword = "Admin123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "admin",
      staff: {
        create: {
          name: "Clinic Admin",
        },
      },
    },
    include: { staff: true },
  });

  console.log("Seeded admin user:", admin.email);

  // Staff
  const staffEmail = "staff@soundforears.test";
  const staffPassword = "Staff123!";
  const staffPasswordHash = await bcrypt.hash(staffPassword, 10);

  const staffUser = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      email: staffEmail,
      passwordHash: staffPasswordHash,
      role: "staff",
      staff: {
        create: {
          name: "Clinic Staff",
          phone: "9999999999",
          permissions: {
            create: {
              canAccessLedger: true,
              canAccessWalkIn: true,
              canAccessAttendance: true,
              canAccessTherapies: true,
            },
          },
        },
      },
    },
    include: {
      staff: {
        include: { permissions: true },
      },
    },
  });

  console.log("Seeded staff user:", staffUser.email);

  // Patient
  const patientEmail = "patient@soundforears.test";
  const patientPassword = "Patient123!";
  const patientPasswordHash = await bcrypt.hash(patientPassword, 10);

  const patientUser = await prisma.user.upsert({
    where: { email: patientEmail },
    update: {},
    create: {
      email: patientEmail,
      passwordHash: patientPasswordHash,
      role: "patient",
      patient: {
        create: {
          patientName: "Parent Name",
          childName: "Child Name",
          age: 7,
          sex: "MALE",
          services: "Speech Therapy",
          amount: 5000,
          advance: 2000,
          due: 3000,
        },
      },
    },
    include: { patient: true },
  });

  console.log("Seeded patient user:", patientUser.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

