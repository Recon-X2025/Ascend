import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function showStats() {
  const [
    totalRaw,
    parsedCount,
    parseErrorCount,
    embeddedCount,
    salarySignalCount,
    topRoles,
    topLocations,
    topSources,
  ] = await Promise.all([
    prisma.rawJD.count(),
    prisma.parsedJD.count(),
    prisma.rawJD.count({ where: { parseError: { not: null } } }),
    prisma.jDEmbedding.count(),
    prisma.jDSalarySignal.count(),
    prisma.parsedJD.groupBy({
      by: ["title"],
      _count: { title: true },
      orderBy: { _count: { title: "desc" } },
      take: 10,
    }),
    prisma.parsedJD.groupBy({
      by: ["location"],
      _count: { location: true },
      orderBy: { _count: { location: "desc" } },
      take: 10,
      where: { location: { not: null } },
    }),
    prisma.rawJD.groupBy({
      by: ["source"],
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    }),
  ]);

  const unparsed = totalRaw - parsedCount - parseErrorCount;
  const unembedded = parsedCount - embeddedCount;

  console.log("\n════════════════════════════════");
  console.log("  ASCEND — Phase 0 Ingestion Stats");
  console.log("════════════════════════════════\n");
  console.log(`Raw JDs total:        ${totalRaw}`);
  console.log(`  Parsed:             ${parsedCount} (${pct(parsedCount, totalRaw)}%)`);
  console.log(`  Awaiting parse:     ${unparsed}`);
  console.log(`  Parse errors:       ${parseErrorCount}`);
  console.log(
    `Embedded:             ${embeddedCount} (${pct(embeddedCount, parsedCount)}% of parsed)`
  );
  console.log(`  Awaiting embed:     ${unembedded}`);
  console.log(`Salary signals:       ${salarySignalCount}`);

  console.log("\n── Sources ──");
  topSources.forEach((s) => console.log(`  ${s.source}: ${s._count.source}`));

  console.log("\n── Top Roles ──");
  topRoles.forEach((r) => console.log(`  ${r.title}: ${r._count.title}`));

  console.log("\n── Top Locations ──");
  topLocations.forEach((l) => console.log(`  ${l.location}: ${l._count.location}`));

  console.log("\n── Phase 0 Targets ──");
  const targets = [
    { label: "Total JDs (target: 50,000)", current: totalRaw, target: 50000 },
    { label: "Parsed JDs (target: 50,000)", current: parsedCount, target: 50000 },
    { label: "Embedded JDs (target: 50,000)", current: embeddedCount, target: 50000 },
    { label: "Salary signals (target: 5,000)", current: salarySignalCount, target: 5000 },
  ];
  targets.forEach((t) => {
    const p = pct(t.current, t.target);
    const bar = "█".repeat(Math.floor(p / 5)) + "░".repeat(20 - Math.floor(p / 5));
    console.log(`  ${t.label}`);
    console.log(
      `  [${bar}] ${t.current.toLocaleString()} / ${t.target.toLocaleString()} (${p}%)`
    );
  });

  await prisma.$disconnect();
}

function pct(n: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((n / total) * 100));
}

showStats().catch(console.error);
