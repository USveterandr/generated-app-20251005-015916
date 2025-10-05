import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bot } from 'lucide-react';
interface OnboardingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function OnboardingModal({ isOpen, onOpenChange }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary mb-4">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">Welcome to BudgetWise AI!</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You're all set up. Let's start your journey to financial clarity.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            You can now log expenses, create budgets, and track your investments.
            Unlock achievements as you build healthy financial habits!
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>
            Let's Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}