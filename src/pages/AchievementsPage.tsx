import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ACHIEVEMENTS, FINANCIAL_TIERS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardData } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
export function AchievementsPage() {
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: () => api('/api/dashboard'),
    enabled: isAuthenticated && !!token,
  });
  const unlockedIds = new Set(data?.user.unlockedAchievementIds || []);
  const totalPoints = data?.totalPoints || 0;
  const currentTier = FINANCIAL_TIERS.slice().reverse().find(tier => totalPoints >= tier.minPoints);
  const nextTier = FINANCIAL_TIERS.find(tier => totalPoints < tier.minPoints);
  const progressToNextTier = nextTier
    ? ((totalPoints - (currentTier?.minPoints || 0)) / (nextTier.minPoints - (currentTier?.minPoints || 0))) * 100
    : 100;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock badges for your financial habits.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  Financial Tier: <span className="text-primary">{currentTier?.name || 'Novice'}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Star className="h-5 w-5 text-yellow-400" />
                  {totalPoints} Points
                </div>
              </div>
              {nextTier ? (
                <div>
                  <Progress value={progressToNextTier} className="mb-2" />
                  <p className="text-sm text-muted-foreground text-right">
                    {nextTier.minPoints - totalPoints} points to reach {nextTier.name}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-primary">You've reached the highest tier!</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))
          : ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedIds.has(achievement.id);
              return (
                <Card
                  key={achievement.id}
                  className={cn(
                    'transition-all duration-300',
                    isUnlocked ? 'border-primary/50 shadow-md' : 'opacity-50'
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">{achievement.title}</CardTitle>
                    <achievement.icon
                      className={cn(
                        'h-8 w-8 text-muted-foreground',
                        isUnlocked && 'text-primary'
                      )}
                    />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {!isUnlocked && (
                      <p className="text-xs font-semibold text-foreground mt-2">LOCKED</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}