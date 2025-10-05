import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { AppLayout } from '@/components/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { AchievementsPage } from '@/pages/AchievementsPage';
import { InvestmentsPage } from '@/pages/InvestmentsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PricingPage } from '@/pages/PricingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamDashboardPage } from '@/pages/TeamDashboardPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { RetirementSimulatorPage } from '@/pages/RetirementSimulatorPage';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useAuthStore } from '@/stores/authStore';
export function Router() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = createBrowserRouter([
    {
      path: "/login",
      element: isAuthenticated ? <Navigate to="/" /> : <LoginPage />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: "/signup",
      element: isAuthenticated ? <Navigate to="/" /> : <SignupPage />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: "/pricing",
      element: <PricingPage />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      element: <SubscriptionGate />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { path: "/", element: <HomePage /> },
            { path: "/budgets", element: <BudgetsPage /> },
            { path: "/investments", element: <InvestmentsPage /> },
            { path: "/goals", element: <GoalsPage /> },
            { path: "/teams", element: <TeamsPage /> },
            { path: "/teams/:teamId", element: <TeamDashboardPage /> },
            { path: "/reports", element: <ReportsPage /> },
            { path: "/documents", element: <DocumentsPage /> },
            { path: "/retirement-simulator", element: <RetirementSimulatorPage /> },
            { path: "/achievements", element: <AchievementsPage /> },
            { path: "/settings", element: <SettingsPage /> },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to={isAuthenticated ? "/" : "/login"} replace />,
    }
  ]);
  return <RouterProvider router={router} />;
}