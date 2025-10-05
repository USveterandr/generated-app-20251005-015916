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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EXPENSE_CATEGORIES, ACHIEVEMENTS } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Budget } from '@shared/types';
import { AchievementToast } from './AchievementToast';
const budgetSchema = z.object({
  limit: z.coerce.number().positive('Limit must be a positive number'),
  category: z.string().min(1, 'Category is required'),
});
type BudgetFormData = z.infer<typeof budgetSchema>;
type BudgetFormInput = z.input<typeof budgetSchema>;
interface CreateBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CreateBudgetDialog({ isOpen, onOpenChange }: CreateBudgetDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetFormInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      limit: '',
    }
  });
  const mutation = useMutation<Budget, Error, BudgetFormData>({
    mutationFn: (newBudget) => api('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(newBudget),
    }),
    onSuccess: (data) => {
      toast.success(`Budget for ${data.category} created successfully!`);
      if (data.unlockedAchievement) {
        const achievement = ACHIEVEMENTS.find(a => a.id === data.unlockedAchievement!.id);
        if (achievement) {
          toast.custom(() => <AchievementToast achievement={achievement} />);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      reset({ category: '', limit: '' });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create budget. Please try again.');
    },
  });
  const onSubmit: SubmitHandler<BudgetFormData> = (data) => {
    mutation.mutate(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Budget</DialogTitle>
          <DialogDescription>
            Set a spending limit for a specific category for the current month.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="budget-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="limit" className="text-right">
                Limit
              </Label>
              <div className="col-span-3">
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500"
                  {...register('limit')}
                  className={errors.limit ? 'border-destructive' : ''}
                />
                {errors.limit && <p className="text-xs text-destructive mt-1">{errors.limit.message}</p>}
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="budget-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}