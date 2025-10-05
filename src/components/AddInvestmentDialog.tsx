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
import { toast } from 'sonner';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ASSET_TYPES, ACHIEVEMENTS } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Investment } from '@shared/types';
import { AchievementToast } from './AchievementToast';
const investmentSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  type: z.enum(['stock', 'crypto', 'real_estate', 'other']),
  quantity: z.coerce.number().positive('Quantity must be a positive number'),
  currentValue: z.coerce.number().positive('Value must be a positive number'),
});
type InvestmentFormData = z.infer<typeof investmentSchema>;
type InvestmentFormInput = z.input<typeof investmentSchema>;
interface AddInvestmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function AddInvestmentDialog({ isOpen, onOpenChange }: AddInvestmentDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<InvestmentFormInput>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      quantity: '',
      currentValue: '',
    }
  });
  const mutation = useMutation<Investment, Error, InvestmentFormData>({
    mutationFn: (newInvestment) => api('/api/investments', {
      method: 'POST',
      body: JSON.stringify(newInvestment),
    }),
    onSuccess: (data) => {
      toast.success('Investment added successfully!');
      if (data.unlockedAchievement) {
        const achievement = ACHIEVEMENTS.find(a => a.id === data.unlockedAchievement!.id);
        if (achievement) {
          toast.custom(() => <AchievementToast achievement={achievement} />);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      reset({ name: '', type: undefined, quantity: '', currentValue: '' });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add investment. Please try again.');
    },
  });
  const onSubmit: SubmitHandler<InvestmentFormData> = (data) => {
    mutation.mutate(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Investment</DialogTitle>
          <DialogDescription>
            Enter the details of your new asset to track it in your portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="investment-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Asset Name
              </Label>
              <div className="col-span-3">
                <Input id="name" placeholder="e.g., Apple Inc." {...register('name')} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-xs text-destructive mt-1">{errors.type.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <div className="col-span-3">
                <Input id="quantity" type="number" placeholder="e.g., 10" {...register('quantity')} />
                {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Current Value
              </Label>
              <div className="col-span-3">
                <Input id="value" type="number" step="0.01" placeholder="0.00" {...register('currentValue')} />
                {errors.currentValue && <p className="text-xs text-destructive mt-1">{errors.currentValue.message}</p>}
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="investment-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add Investment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}