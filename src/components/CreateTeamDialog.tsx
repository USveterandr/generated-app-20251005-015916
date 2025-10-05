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
const teamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters'),
});
type TeamFormData = z.infer<typeof teamSchema>;
interface CreateTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CreateTeamDialog({ isOpen, onOpenChange }: CreateTeamDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
    },
  });
  const onSubmit: SubmitHandler<TeamFormData> = async (data) => {
    try {
      await api('/api/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success(`Team "${data.name}" created successfully!`);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team. Please try again.');
      console.error(error);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>
            Give your team a name to get started. You can invite members later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="team-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Team Name
              </Label>
              <div className="col-span-3">
                <Input id="name" placeholder="e.g., Family Finances" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="team-form" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}