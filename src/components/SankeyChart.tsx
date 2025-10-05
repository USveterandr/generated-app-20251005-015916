import { Sankey, ResponsiveContainer, Tooltip } from 'recharts';
import { SankeyNode, SankeyLink } from '@shared/types';
interface SankeyChartProps {
  data: {
    nodes: SankeyNode[];
    links: SankeyLink[];
  };
}
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f',
  '#ffbb28', '#ff8c00', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed'
];
export function SankeyChart({ data }: SankeyChartProps) {
  if (!data || data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Not enough data to display the chart. Log some expenses to get started.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Sankey
        data={data}
        nodePadding={50}
        margin={{
          left: 100,
          right: 100,
          top: 20,
          bottom: 20,
        }}
        link={{ stroke: '#777' }}
      >
        <Tooltip />
        {data.nodes.map((node, i) => (
          <rect
            key={node.name}
            fill={COLORS[i % COLORS.length]}
            // Recharts Sankey doesn't directly support node components,
            // so we can't easily add labels this way. The labels are
            // part of the Sankey component's internal rendering.
            // This is a placeholder to show color assignment.
          />
        ))}
      </Sankey>
    </ResponsiveContainer>
  );
}