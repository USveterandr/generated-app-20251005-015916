import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Wallet, Trophy, Settings, Bot, LineChart, Flag, Users, PieChart, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/investments', label: 'Investments', icon: LineChart },
  { href: '/goals', label: 'Goals', icon: Flag },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/reports', label: 'Reports', icon: PieChart },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/retirement-simulator', label: 'Retirement Sim', icon: TrendingUp },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
];
export function AppLayout() {
  return (
    <div className="min-h-screen w-full flex bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Bot className="h-6 w-6 text-primary" />
            <span className="">BudgetWise AI</span>
          </NavLink>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent',
                  isActive && 'bg-accent text-primary font-semibold'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4">
           <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent',
                  isActive && 'bg-accent text-primary font-semibold'
                )
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6">
           <ThemeToggle className="relative top-0 right-0" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}