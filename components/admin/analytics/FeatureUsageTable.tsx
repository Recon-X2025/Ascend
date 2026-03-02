"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type FeatureRow = {
  feature: string;
  totalUses: number;
  uniqueUsers: number;
  topPersona: string;
  topPersonaPct: number;
};

const PERSONA_LABELS: Record<string, string> = {
  ACTIVE_SEEKER: "Active Seeker",
  PASSIVE_SEEKER: "Passive Seeker",
  EARLY_CAREER: "Early Career",
  RECRUITER: "Recruiter",
  NO_PERSONA: "No persona",
};

export function FeatureUsageTable({ rows }: { rows: FeatureRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead className="text-right">Total Uses</TableHead>
          <TableHead className="text-right">Unique Users</TableHead>
          <TableHead className="text-right">By Persona (top)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.feature}>
            <TableCell className="font-medium">{row.feature}</TableCell>
            <TableCell className="text-right">{row.totalUses.toLocaleString()}</TableCell>
            <TableCell className="text-right">{row.uniqueUsers.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              {PERSONA_LABELS[row.topPersona] ?? row.topPersona} {row.topPersonaPct}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
