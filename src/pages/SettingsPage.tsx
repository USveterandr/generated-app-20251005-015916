import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardData, User } from '@shared/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROFESSIONS } from '@/lib/constants';
import { ApplyTemplateDialog } from '@/components/ApplyTemplateDialog';
export function SettingsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: () => api('/api/dashboard'),
    enabled: isAuthenticated && !!token,
  });
  const [name, setName] = useState('');
  const [profession, setProfession] = useState<string | undefined>(undefined);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  useEffect(() => {
    if (dashboardData?.user) {
      setName(dashboardData.user.name);
      setProfession(dashboardData.user.profession || undefined);
    }
  }, [dashboardData]);
  const updateUserMutation = useMutation<User, Error, { name: string; profession?: string }>({
    mutationFn: (updatedUser) => api('/api/user', {
      method: 'PUT',
      body: JSON.stringify(updatedUser),
    }),
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.');
    },
  });
  const handleSaveChanges = () => {
    if (name.trim() === '') {
      toast.error('Name cannot be empty.');
      return;
    }
    updateUserMutation.mutate({ name, profession });
  };
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={dashboardData?.user?.email || ''} disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="profession">Profession</Label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger id="profession">
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveChanges} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Personalization</CardTitle>
          <CardDescription>Tailor the app to your needs with category templates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Budget Templates</Label>
              <p className="text-sm text-muted-foreground">
                Apply a set of common budget categories based on your selected profession.
              </p>
            </div>
            <Button onClick={() => setTemplateDialogOpen(true)} disabled={!profession}>
              Apply Template
            </Button>
          </div>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications (UI only for now).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="budget-alerts" className="text-base">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive an email when you're approaching a budget limit.
              </p>
            </div>
            <Switch id="budget-alerts" checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-summary" className="text-base">Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Get a summary of your financial activity every week.
              </p>
            </div>
            <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={setWeeklySummary} />
          </div>
        </CardContent>
      </Card>
      {profession && (
        <ApplyTemplateDialog
          isOpen={isTemplateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          profession={profession}
        />
      )}
    </div>
  );
}