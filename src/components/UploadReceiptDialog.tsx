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
import { toast } from 'sonner';
import { apiWithFormData } from '@/lib/api-client';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
const receiptSchema = z.object({
  vendor: z.string().min(1, 'Vendor name is required'),
  amount: z.coerce.number().positive('Amount is required for non-image uploads'),
  receipt: z.instanceof(FileList).refine(files => files.length > 0, 'A file is required.'),
});
type ReceiptFormInput = z.input<typeof receiptSchema>;
type ReceiptFormData = z.infer<typeof receiptSchema>;
interface UploadReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function UploadReceiptDialog({ isOpen, onOpenChange }: UploadReceiptDialogProps) {
  const { teamId } = useParams<{ teamId: string }>();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormInput>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      vendor: '',
      amount: undefined,
      receipt: undefined,
    },
  });
  const onSubmit: SubmitHandler<ReceiptFormData> = async (data) => {
    if (!teamId) {
      toast.error('Could not identify the team. Please try again.');
      return;
    }
    const formData = new FormData();
    formData.append('receipt', data.receipt[0]);
    formData.append('vendor', data.vendor);
    formData.append('amount', data.amount.toString());
    try {
      await apiWithFormData(`/api/teams/${teamId}/receipts`, formData);
      toast.success('Document uploaded for processing!');
      await queryClient.invalidateQueries({ queryKey: ['documents', teamId] });
      await queryClient.invalidateQueries({ queryKey: ['allDocuments'] });
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document.');
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload a Document</DialogTitle>
          <DialogDescription>
            Upload a receipt image for AI scanning, or a PDF/CSV for your records.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="receipt-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receipt" className="text-right">
                File
              </Label>
              <div className="col-span-3">
                <Input
                  id="receipt"
                  type="file"
                  {...register('receipt')}
                  accept=".png,.jpg,.jpeg,.pdf,.csv"
                />
                {errors.receipt && <p className="text-xs text-destructive mt-1">{errors.receipt.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor" className="text-right">
                Vendor
              </Label>
              <div className="col-span-3">
                <Input id="vendor" placeholder="e.g., Starbucks" {...register('vendor')} />
                {errors.vendor && <p className="text-xs text-destructive mt-1">{errors.vendor.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Total
              </Label>
              <div className="col-span-3">
                <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount')} />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Required for PDF/CSV, optional for images.</p>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="receipt-form" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}