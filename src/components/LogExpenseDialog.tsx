import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@shared/types';
import { AchievementToast } from './AchievementToast';
const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});
type ExpenseFormData = z.infer<typeof expenseSchema>;
type ExpenseFormInput = z.input<typeof expenseSchema>;
export function LogExpenseDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
    },
  });
  const mutation = useMutation<Transaction, Error, ExpenseFormData>({
    mutationFn: (newExpense) => api('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(newExpense),
    }),
    onSuccess: (data) => {
      toast.success('Expense logged successfully!');
      if (data.unlockedAchievement) {
        const achievement = ACHIEVEMENTS.find(a => a.id === data.unlockedAchievement!.id);
        if (achievement) {
          toast.custom(() => <AchievementToast achievement={achievement} />);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      reset({ date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '' });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to log expense. Please try again.');
    },
  });
  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    mutation.mutate(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Log Expense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log a New Expense</DialogTitle>
          <DialogDescription>
            Enter the details of your expense. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="expense-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                  className={errors.amount ? 'border-destructive' : ''}
                />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
              </div>
            </div>
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
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Input
                  id="description"
                  placeholder="e.g. Coffee with a friend"
                  {...register('description')}
                />
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="expense-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}