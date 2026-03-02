"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PERSONA_LABELS } from "./PersonaColors";

export type PersonaSlice = { name: string; value: number; fill: string };

export function PersonaDonut({ data }: { data: PersonaSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          formatter={(value: number, name: string) => {
            const total = data.reduce((s, d) => s + d.value, 0);
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return [`${value} (${pct}%)`, PERSONA_LABELS[name] ?? name];
          }}
        />
        <Legend formatter={(value) => PERSONA_LABELS[value] ?? value} />
      </PieChart>
    </ResponsiveContainer>
  );
}
