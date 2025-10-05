import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SimulationResult } from '@/lib/montecarlo';
interface RetirementChartProps {
  data: SimulationResult[];
}
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(value);
export function RetirementChart({ data }: RetirementChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="year" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
        <defs>
          <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
           <linearGradient id="colorP10" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="p90" name="Optimistic (90th %)" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorP90)" />
        <Area type="monotone" dataKey="p50" name="Median (50th %)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorP50)" />
        <Area type="monotone" dataKey="p10" name="Pessimistic (10th %)" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorP10)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}