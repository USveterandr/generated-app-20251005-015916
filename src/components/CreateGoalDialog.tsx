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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Goal } from '@shared/types';
import { ACHIEVEMENTS } from '@/lib/constants';
import { AchievementToast } from './AchievementToast';
const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  targetAmount: z.coerce.number().positive('Target amount must be a positive number'),
  targetDate: z.string().min(1, 'Target date is required'),
});
type GoalFormData = z.infer<typeof goalSchema>;
type GoalFormInput = z.input<typeof goalSchema>;
interface CreateGoalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CreateGoalDialog({ isOpen, onOpenChange }: CreateGoalDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: undefined,
      targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
  });
  const mutation = useMutation<Goal, Error, GoalFormData>({
    mutationFn: (newGoal) => api('/api/goals', {
      method: 'POST',
      body: JSON.stringify(newGoal),
    }),
    onSuccess: (data) => {
      toast.success(`Goal "${data.name}" created successfully!`);
      if (data.unlockedAchievement) {
        const achievement = ACHIEVEMENTS.find(a => a.id === data.unlockedAchievement!.id);
        if (achievement) {
          toast.custom(() => <AchievementToast achievement={achievement} />);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create goal. Please try again.');
    },
  });
  const onSubmit: SubmitHandler<GoalFormData> = (data) => {
    mutation.mutate(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Goal</DialogTitle>
          <DialogDescription>
            Define your financial target and set a date to achieve it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="goal-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Goal Name
              </Label>
              <div className="col-span-3">
                <Input id="name" placeholder="e.g., Vacation Fund" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetAmount" className="text-right">
                Target Amount
              </Label>
              <div className="col-span-3">
                <Input id="targetAmount" type="number" step="1" placeholder="e.g., 2000" {...register('targetAmount')} />
                {errors.targetAmount && <p className="text-xs text-destructive mt-1">{errors.targetAmount.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetDate" className="text-right">
                Target Date
              </Label>
              <div className="col-span-3">
                <Input id="targetDate" type="date" {...register('targetDate')} />
                {errors.targetDate && <p className="text-xs text-destructive mt-1">{errors.targetDate.message}</p>}
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="goal-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}