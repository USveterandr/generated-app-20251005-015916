import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Users, User, Crown, Mail, Eye } from 'lucide-react';
import { CreateTeamDialog } from '@/components/CreateTeamDialog';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { Team } from '@shared/types';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { useShallow } from 'zustand/shallow';
function TeamCard({ team, onInvite }: { team: Team; onInvite: (team: Team) => void; }) {
  const currentUserId = useAuthStore.getState().userId;
  const isOwner = team.ownerId === currentUserId;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {team.name}
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 text-xs font-semibold text-yellow-500">
              <Crown className="h-4 w-4" />
              Owner
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{team.memberIds.length} Member(s)</span>
        </div>
        <div className="flex -space-x-2 overflow-hidden">
          {team.memberIds.slice(0, 5).map((id, i) => (
            <Avatar key={id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
              <AvatarFallback>{i + 1}</AvatarFallback>
            </Avatar>
          ))}
          {team.memberIds.length > 5 && (
            <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
              <AvatarFallback>+{team.memberIds.length - 5}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
      <CardContent className="flex gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/teams/${team.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View
          </Link>
        </Button>
        {isOwner && (
          <Button onClick={() => onInvite(team)} className="w-full">
            <Mail className="mr-2 h-4 w-4" /> Invite
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
function TeamSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex -space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
export function TeamsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api('/api/teams'),
    enabled: isAuthenticated && !!token,
  });
  const handleInviteClick = (team: Team) => {
    setSelectedTeam(team);
    setInviteDialogOpen(true);
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Collaborate on finances with your team or family. (Business Pro Feature)
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <TeamSkeleton key={i} />)}
        </div>
      )}
      {error && (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load teams</CardTitle>
            <CardDescription>Please try refreshing the page.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {!isLoading && teams && teams.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => <TeamCard key={team.id} team={team} onInvite={handleInviteClick} />)}
        </div>
      )}
      {!isLoading && teams && teams.length === 0 && (
        <Card className="text-center col-span-full py-12">
          <CardHeader>
            <CardTitle>No Teams Yet</CardTitle>
            <CardDescription>
              Create your first team to manage shared budgets and expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
      <CreateTeamDialog isOpen={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
      {selectedTeam && (
        <InviteMemberDialog
          team={selectedTeam}
          isOpen={isInviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}
    </div>
  );
}