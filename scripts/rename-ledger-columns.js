/**
 * One-time: rename Ledger.income -> cr, Ledger.expense -> dr (preserves data).
 * Run: node scripts/rename-ledger-columns.js
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE Ledger CHANGE COLUMN income cr INT NOT NULL DEFAULT 0"
    );
    console.log("Renamed income -> cr");
  } catch (e) {
    if (e.message && e.message.includes("Unknown column 'income'")) {
      console.log("Column income already renamed or missing (cr may exist).");
    } else throw e;
  }
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE Ledger CHANGE COLUMN expense dr INT NOT NULL DEFAULT 0"
    );
    console.log("Renamed expense -> dr");
  } catch (e) {
    if (e.message && e.message.includes("Unknown column 'expense'")) {
      console.log("Column expense already renamed or missing (dr may exist).");
    } else throw e;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
