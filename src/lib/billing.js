import prisma from "@/lib/prisma";

/**
 * Create an automatic ledger DR entry for a given attendance record.
 * Uses patient.amount and patient.noOfSessions to compute per-session charge.
 */
export async function createAutoSessionDebitForAttendance(attendance) {
  if (!attendance?.patientId) return;

  const patient = await prisma.patient.findUnique({
    where: { id: attendance.patientId },
  });

  if (!patient || !patient.noOfSessions || patient.noOfSessions <= 0) return;
  if (!patient.amount || patient.amount <= 0) return;

  const perSession = Math.round(patient.amount / patient.noOfSessions);
  if (!perSession) return;

  await prisma.ledger.create({
    data: {
      date: attendance.date,
      patientId: attendance.patientId,
      description: `AUTO: Session debit (attendance ${attendance.id})`,
      dr: perSession,
    },
  });
}

/**
 * Remove any automatic ledger DR entry that was created for a given attendance.
 */
export async function deleteAutoSessionDebitForAttendance(attendanceId) {
  if (!attendanceId) return;

  await prisma.ledger.deleteMany({
    where: {
      description: `AUTO: Session debit (attendance ${attendanceId})`,
    },
  });
}

