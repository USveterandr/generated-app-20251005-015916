import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Target, Flag, Calendar } from 'lucide-react';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { Goal } from '@shared/types';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
function GoalCard({ goal }: { goal: Goal }) {
  const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  const isComplete = remaining <= 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          {goal.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
            <Calendar className="h-4 w-4" />
            Target Date: {format(new Date(goal.targetDate), 'MMM d, yyyy')} ({formatDistanceToNow(new Date(goal.targetDate), { addSuffix: true })})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-sm text-muted-foreground">of {formatCurrency(goal.targetAmount)}</span>
        </div>
        <Progress value={percentage} />
        <p className={`text-sm font-medium ${isComplete ? 'text-green-500' : 'text-muted-foreground'}`}>
          {isComplete
            ? 'Goal achieved! ��'
            : `${formatCurrency(remaining)} remaining`}
        </p>
      </CardContent>
    </Card>
  );
}
function GoalSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
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
export function GoalsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data: goals, isLoading, error } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api('/api/goals'),
    enabled: isAuthenticated && !!token,
  });
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">
            Set and track your savings goals to achieve your dreams.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <GoalSkeleton key={i} />)}
        </div>
      )}
      {error && (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load goals</CardTitle>
            <CardDescription>Please try refreshing the page.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {!isLoading && goals && goals.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
      {!isLoading && goals && goals.length === 0 && (
        <Card className="text-center col-span-full py-12">
          <CardHeader>
            <CardTitle>No Goals Yet</CardTitle>
            <CardDescription>
              What are you saving for? Create your first goal to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Target className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
      <CreateGoalDialog isOpen={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}