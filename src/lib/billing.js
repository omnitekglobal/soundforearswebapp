import prisma from "@/lib/prisma";

/**
 * Create an automatic ledger DR entry for a given attendance record.
 * Uses patient.amount and patient.noOfSessions to compute per-session charge.
 * When registration amount is exhausted (amount 0), uses the last AUTO session
 * debit rate for this patient so balance can go negative when attendance is marked.
 */
export async function createAutoSessionDebitForAttendance(attendance) {
  if (!attendance?.patientId) return;

  const patient = await prisma.patient.findUnique({
    where: { id: attendance.patientId },
  });

  if (!patient || !patient.noOfSessions || patient.noOfSessions <= 0) return;

  let perSession = 0;
  // Prefer explicit per-session charge if provided
  if (patient.perSessionCharge != null && patient.perSessionCharge > 0) {
    perSession = patient.perSessionCharge;
  } else if (patient.amount != null && patient.amount > 0) {
    perSession = Math.round(patient.amount / patient.noOfSessions);
  }
  // When package is exhausted (amount 0 and no explicit per-session), allow negative balance:
  // use last AUTO session debit rate
  if (perSession <= 0) {
    const lastAuto = await prisma.ledger.findFirst({
      where: {
        patientId: attendance.patientId,
        description: { startsWith: "AUTO: Session debit (attendance " },
        dr: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
    });
    if (lastAuto) perSession = lastAuto.dr;
  }
  if (perSession <= 0) return;

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

