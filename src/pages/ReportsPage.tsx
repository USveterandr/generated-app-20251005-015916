import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SankeyChart } from '@/components/SankeyChart';
import { api } from '@/lib/api-client';
import { SankeyNode, SankeyLink } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
function ReportSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
export function ReportsPage() {
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data, isLoading, error } = useQuery<SankeyData>({
    queryKey: ['sankeyReport'],
    queryFn: () => api('/api/reports/sankey'),
    enabled: isAuthenticated && !!token,
  });
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Visualize your spending habits and financial flows.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Spending Flow</CardTitle>
          <CardDescription>
            This Sankey diagram shows how your income is distributed across different spending categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-96 w-full" />}
          {error && (
            <div className="flex items-center justify-center h-96 text-destructive">
              Failed to load report data. Please try again later.
            </div>
          )}
          {data && <SankeyChart data={data} />}
        </CardContent>
      </Card>
    </div>
  );
}