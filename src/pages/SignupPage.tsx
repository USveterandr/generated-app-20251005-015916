import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler, Controller, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@shared/types';
import { Stepper } from '@/components/Stepper';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
const budgetSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  limit: z.coerce.number().positive('Limit must be a positive number'),
});
const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  targetAmount: z.coerce.number().positive('Target must be a positive number'),
  targetDate: z.string().min(1, 'Target date is required'),
});
const fullSignupSchema = accountSchema.extend({
  initialBudget: budgetSchema,
  initialGoal: goalSchema,
});
type SignupFormData = z.infer<typeof fullSignupSchema>;
type SignupFormInput = z.input<typeof fullSignupSchema>;
const steps = ['Account', 'Budget', 'Goal'];
export function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors },
  } = useForm<SignupFormInput>({
    resolver: zodResolver(fullSignupSchema),
    defaultValues: {
      initialBudget: {
        limit: undefined,
      },
      initialGoal: {
        targetAmount: undefined,
        targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      },
    },
  });
  const handleNext = async () => {
    let fieldsToValidate: FieldPath<SignupFormData>[] = [];
    if (currentStep === 0) fieldsToValidate = ['name', 'email', 'password'];
    if (currentStep === 1) fieldsToValidate = ['initialBudget.category', 'initialBudget.limit'];
    if (currentStep === 2) fieldsToValidate = ['initialGoal.name', 'initialGoal.targetAmount', 'initialGoal.targetDate'];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  const handleBack = () => setCurrentStep((prev) => prev - 1);
  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setIsLoading(true);
    try {
      const response = await api<{ user: User; token: string }>('/api/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAuth(response.token, response.user.id);
      toast.success('Welcome to BudgetWise AI!');
      navigate('/?new=true');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-lg w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BudgetWise AI</span>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Join us in just a few steps to master your finances.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex justify-center">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Alex" {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="m@example.com" {...register('email')} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" {...register('password')} />
                      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="grid gap-4">
                    <h3 className="font-semibold text-center">Set Your First Budget</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="budget-category">Spending Category</Label>
                      <Controller
                        name="initialBudget.category"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>
                              {EXPENSE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.initialBudget?.category && <p className="text-xs text-destructive">{errors.initialBudget.category.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget-limit">Monthly Limit</Label>
                      <Input id="budget-limit" type="number" placeholder="e.g., 500" {...register('initialBudget.limit')} />
                      {errors.initialBudget?.limit && <p className="text-xs text-destructive">{errors.initialBudget.limit.message}</p>}
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="grid gap-4">
                    <h3 className="font-semibold text-center">Define a Financial Goal</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="goal-name">Goal Name</Label>
                      <Input id="goal-name" placeholder="e.g., Vacation Fund" {...register('initialGoal.name')} />
                      {errors.initialGoal?.name && <p className="text-xs text-destructive">{errors.initialGoal.name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="goal-amount">Target Amount</Label>
                      <Input id="goal-amount" type="number" placeholder="e.g., 2000" {...register('initialGoal.targetAmount')} />
                      {errors.initialGoal?.targetAmount && <p className="text-xs text-destructive">{errors.initialGoal.targetAmount.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="goal-date">Target Date</Label>
                      <Input id="goal-date" type="date" {...register('initialGoal.targetDate')} />
                      {errors.initialGoal?.targetDate && <p className="text-xs text-destructive">{errors.initialGoal.targetDate.message}</p>}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex justify-between">
              {currentStep > 0 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : <div />}
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext}>Next</Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              )}
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline">Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}