import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { DashboardData } from '@shared/types';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
export function SubscriptionGate() {
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: () => api('/api/dashboard'),
    // This is the critical fix: ensure both authenticated flag is true AND token exists
    // to prevent unauthorized requests on initial load or state transitions.
    enabled: isAuthenticated && !!token,
    retry: 1,
  });
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isError) {
    // This could happen if the API is down or if there's a fundamental error.
    // Redirecting to pricing is a safe fallback.
    return <Navigate to="/pricing" replace />;
  }
  const user = data?.user;
  const hasActiveSubscription = user?.subscriptionPlan && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  if (!hasActiveSubscription) {
    return <Navigate to="/pricing" replace />;
  }
  return <Outlet />;
}