import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Budget } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateBudgetDialog } from '@/components/CreateBudgetDialog';
import { CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
function BudgetCard({ budget }: { budget: Budget }) {
  const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const remaining = budget.limit - budget.spent;
  const isOverBudget = remaining < 0;
  const Icon = CATEGORY_ICONS[budget.category] || Target;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {budget.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">${budget.spent.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">of ${budget.limit.toFixed(2)}</span>
        </div>
        <Progress
          value={percentage}
          className={cn(
            percentage > 85 && !isOverBudget && '[&>div]:bg-yellow-500',
            isOverBudget && '[&>div]:bg-destructive'
          )}
        />
        <p
          className={`text-sm font-medium ${
            isOverBudget ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {isOverBudget
            ? `${Math.abs(remaining).toFixed(2)} over budget`
            : `${remaining.toFixed(2)} remaining`}
        </p>
      </CardContent>
    </Card>
  );
}
function BudgetSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-baseline">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}
export function BudgetsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data: budgets, isLoading, error } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: () => api('/api/budgets'),
    enabled: isAuthenticated && !!token,
  });
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Manage your monthly spending limits for different categories.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BudgetSkeleton key={i} />
          ))}
        </div>
      )}
      {error && (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load budgets</CardTitle>
            <CardDescription>Please try refreshing the page.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {!isLoading && budgets && budgets.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}
      {!isLoading && budgets && budgets.length === 0 && (
        <Card className="text-center col-span-full py-12">
          <CardHeader>
            <CardTitle>No Budgets Yet</CardTitle>
            <CardDescription>
              Create your first budget to start tracking your spending goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
      <CreateBudgetDialog isOpen={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}