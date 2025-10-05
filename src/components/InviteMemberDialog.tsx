import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Team } from '@shared/types';
const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type InviteFormData = z.infer<typeof inviteSchema>;
interface InviteMemberDialogProps {
  team: Team;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function InviteMemberDialog({ team, isOpen, onOpenChange }: InviteMemberDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });
  const onSubmit: SubmitHandler<InviteFormData> = async (data) => {
    try {
      await api(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success(`Invitation sent to ${data.email}!`);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation.');
      console.error(error);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member to {team.name}</DialogTitle>
          <DialogDescription>
            Enter the email of the user you want to invite to your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="invite-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input id="email" type="email" placeholder="member@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="invite-form" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}