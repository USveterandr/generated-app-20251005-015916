import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TeamDashboardData } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, Target, PlusCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { CATEGORY_ICONS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateTeamBudgetDialog } from '@/components/CreateTeamBudgetDialog';
import { UploadReceiptDialog } from '@/components/UploadReceiptDialog';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
function TeamBudgetProgressCard({ budget }: { budget: import('@shared/types').TeamBudget }) {
  const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const isOverBudget = budget.spent > budget.limit;
  const Icon = CATEGORY_ICONS[budget.category] || Target;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{budget.category}</span>
        </div>
        <span className="font-semibold text-sm">
          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          percentage > 85 && !isOverBudget && '[&>div]:bg-yellow-500',
          isOverBudget && '[&>div]:bg-destructive'
        )}
      />
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export function TeamDashboardPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [isCreateBudgetDialogOpen, setCreateBudgetDialogOpen] = useState(false);
  const [isUploadReceiptDialogOpen, setUploadReceiptDialogOpen] = useState(false);
  const { isAuthenticated, token, userId: currentUserId } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
      userId: state.userId,
    }))
  );
  const { data, isLoading, error } = useQuery<TeamDashboardData>({
    queryKey: ['teamDashboard', teamId],
    queryFn: () => api(`/api/teams/${teamId}/dashboard`),
    enabled: !!teamId && isAuthenticated && !!token,
  });
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (error) {
    return (
      <div className="text-center text-destructive">
        Failed to load team dashboard. You may not have access to this team.
      </div>
    );
  }
  const { team, monthlySpending, recentTransactions, teamBudgets } = data!;
  const isOwner = team.ownerId === currentUserId;
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team: {team.name}</h1>
          <p className="text-muted-foreground">A shared financial overview for your team.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Spending</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlySpending)}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Team Transactions</CardTitle>
            <CardDescription>The last 10 transactions from all team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => {
                  const Icon = CATEGORY_ICONS[tx.category] || Target;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="font-medium">{tx.description || tx.category}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{tx.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(tx.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Budgets</CardTitle>
                  <CardDescription>Shared spending limits.</CardDescription>
                </div>
                {isOwner && (
                  <Button size="sm" onClick={() => setCreateBudgetDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamBudgets.length > 0 ? (
                teamBudgets.map((budget) => (
                  <TeamBudgetProgressCard key={budget.id} budget={budget} />
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <p>No team budgets set yet.</p>
                  {isOwner && <p>Create one to get started!</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Magic Receipts</CardTitle>
              <CardDescription>Automated expense tracking via uploads.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center gap-4 py-8">
              <Receipt className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Upload, scan, and manage all your team's documents in one place.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setUploadReceiptDialogOpen(true)}>
                  Upload Document
                </Button>
                <Button asChild variant="outline">
                  <Link to="/documents">View All Documents</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {isOwner && (
        <CreateTeamBudgetDialog
          team={team}
          isOpen={isCreateBudgetDialogOpen}
          onOpenChange={setCreateBudgetDialogOpen}
        />
      )}
      <UploadReceiptDialog
        isOpen={isUploadReceiptDialogOpen}
        onOpenChange={setUploadReceiptDialogOpen}
      />
    </div>
  );
}