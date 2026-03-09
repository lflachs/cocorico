'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ActivityData {
  day: string;
  bills: number;
  dlcs: number;
  sales: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barGap={2}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#888' }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="bills" name="Factures" fill="#262626" radius={[4, 4, 0, 0]} />
        <Bar dataKey="dlcs" name="DLC" fill="#E53E2F" radius={[4, 4, 0, 0]} />
        <Bar dataKey="sales" name="Ventes" fill="#737373" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
