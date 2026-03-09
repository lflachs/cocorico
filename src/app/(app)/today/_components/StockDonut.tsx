'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StockDonutProps {
  healthy: number;
  low: number;
  out: number;
}

export function StockDonut({ healthy, low, out }: StockDonutProps) {
  const data = [
    { name: 'OK', value: healthy, color: '#262626' },
    { name: 'Bas', value: low, color: '#E53E2F' },
    { name: 'Rupture', value: out, color: '#dc2626' },
  ].filter(d => d.value > 0);

  const total = healthy + low + out;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
        Aucun produit
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={50}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-[10px] text-muted-foreground">produits</div>
        </div>
      </div>
    </div>
  );
}
