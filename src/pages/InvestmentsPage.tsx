import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, TrendingUp, DollarSign, Bitcoin, Building } from 'lucide-react';
import { AddInvestmentDialog } from '@/components/AddInvestmentDialog';
import { Investment } from '@shared/types';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_TYPES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const ASSET_ICONS: { [key: string]: React.ComponentType<any> } = {
  'stock': TrendingUp,
  'crypto': Bitcoin,
  'real_estate': Building,
  'other': DollarSign,
};
function InvestmentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20 text-right" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
export function InvestmentsPage() {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data: investments = [], isLoading, error } = useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: () => api('/api/investments'),
    enabled: isAuthenticated && !!token,
  });
  const totalValue = investments.reduce((sum, asset) => sum + asset.currentValue, 0);
  if (isLoading) {
    return <InvestmentSkeleton />;
  }
  if (error) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to load investments</CardTitle>
          <CardDescription>Please try refreshing the page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">Track your portfolio and watch your assets grow.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-sm text-muted-foreground">Total portfolio value</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Assets</CardTitle>
          <CardDescription>A list of all your current investments.</CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Quantity</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((asset) => {
                  const Icon = ASSET_ICONS[asset.type] || DollarSign;
                  const typeLabel = ASSET_TYPES.find(t => t.id === asset.type)?.label || 'Other';
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{asset.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{typeLabel}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">{asset.quantity}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(asset.currentValue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No Investments Yet</h3>
              <p className="text-muted-foreground mt-2">
                Add your first investment to start tracking your portfolio.
              </p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Investment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <AddInvestmentDialog isOpen={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}