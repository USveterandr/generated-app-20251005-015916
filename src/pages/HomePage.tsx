import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { LogExpenseDialog } from '@/components/LogExpenseDialog';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardData, Transaction, Budget } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORY_ICONS } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AIChat } from '@/components/AIChat';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
import { OnboardingModal } from '@/components/OnboardingModal';
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
function BudgetProgressCard({ budget }: { budget: Budget }) {
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
function DashboardCard({ title, value, icon: Icon, trend, trendText }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
            )}
            {trendText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>No transactions logged yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Log your first expense to see it here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your last 5 expenses.</CardDescription>
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
            {transactions.map((tx) => {
              const Icon = CATEGORY_ICONS[tx.category] || Target;
              return (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{tx.description || tx.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{tx.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{format(new Date(tx.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
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
export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showOnboarding, setShowOnboarding] = useState(searchParams.get('new') === 'true');
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      // Clean up the URL after showing the modal
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: () => api('/api/dashboard'),
    enabled: isAuthenticated && !!token,
  });
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (error) {
    return (
      <div className="text-center text-destructive">
        Failed to load dashboard data. Please try again later.
      </div>
    );
  }
  const { user, monthlySpending, totalPoints, budgetSummary, recentTransactions } = data!;
  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onOpenChange={setShowOnboarding} />
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">Here's a summary of your financial activity.</p>
          </div>
          <div className="flex items-center space-x-2">
            <LogExpenseDialog />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Monthly Spending"
            value={formatCurrency(monthlySpending)}
            icon={TrendingDown}
          />
          <DashboardCard
            title="Total Points"
            value={`${totalPoints}`}
            icon={Star}
          />
          <DashboardCard
            title="Daily Streak"
            value={`${user.streak} Days`}
            icon={Flame}
            trend="up"
            trendText="Keep it going!"
          />
          <DashboardCard
            title="Achievements"
            value={`${user.unlockedAchievementIds.length} Unlocked`}
            icon={Target}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecentTransactions transactions={recentTransactions} />
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>Your spending vs your limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetSummary.length > 0 ? (
                budgetSummary.map((budget) => (
                  <BudgetProgressCard key={budget.id} budget={budget} />
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <p>No budgets set yet.</p>
                  <p>Create one on the Budgets page!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AIChat />
        </div>
      </div>
    </>
  );
}