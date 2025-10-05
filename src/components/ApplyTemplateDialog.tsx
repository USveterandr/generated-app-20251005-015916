import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { PROFESSIONS, CATEGORY_TEMPLATES } from '@/lib/constants';
import { CheckCircle } from 'lucide-react';
interface ApplyTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profession: string;
}
export function ApplyTemplateDialog({ isOpen, onOpenChange, profession }: ApplyTemplateDialogProps) {
  const queryClient = useQueryClient();
  const professionLabel = PROFESSIONS.find(p => p.id === profession)?.label || 'Selected';
  const templateCategories = CATEGORY_TEMPLATES[profession as keyof typeof CATEGORY_TEMPLATES] || [];
  const mutation = useMutation({
    mutationFn: () => api('/api/user/apply-template', {
      method: 'POST',
      body: JSON.stringify({ profession }),
    }),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Template applied successfully!');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to apply template.');
    },
  });
  const handleApply = () => {
    mutation.mutate();
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply '{professionLabel}' Template?</DialogTitle>
          <DialogDescription>
            This will add the following budget categories if they don't already exist.
            Your existing budgets will not be affected.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-2">
            {templateCategories.map(cat => (
              <li key={cat} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={mutation.isPending}>
            {mutation.isPending ? 'Applying...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}