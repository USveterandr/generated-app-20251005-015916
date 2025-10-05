import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle, Bot } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { User } from '@shared/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
const plans = {
  monthly: [
    {
      name: 'Personal Plus',
      id: 'personal',
      price: '$14.99',
      priceSuffix: '/ month',
      description: 'For individuals serious about financial health.',
      features: [
        'All Core Features',
        'Net Worth Tracking',
        'Investment Portfolio Syncing',
        'Advanced Sankey Diagrams',
      ],
      popular: false,
    },
  ],
  annual: [
    {
      name: 'Personal Plus',
      id: 'personal',
      price: '$149',
      priceSuffix: '/ year',
      description: 'Save over 15% with an annual plan.',
      features: [
        'All Core Features',
        'Net Worth Tracking',
        'Investment Portfolio Syncing',
        'Advanced Sankey Diagrams',
      ],
      popular: true,
    },
  ],
};
type PlanId = 'personal' | 'investor' | 'business';
export function PricingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAnnual, setIsAnnual] = useState(false);
  const subscribeMutation = useMutation<User, Error, { plan: PlanId }>({
    mutationFn: (newSubscription) => api('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(newSubscription),
    }),
    onSuccess: () => {
      toast.success('Your 14-day free trial has started!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start trial. Please try again.');
    },
  });
  const handleStartTrial = (planId: PlanId) => {
    // For this version, all plans are the same for trial purposes
    subscribeMutation.mutate({ plan: 'investor' });
  };
  const currentPlans = isAnnual ? plans.annual : plans.monthly;
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-1 text-sm font-medium">
            <Bot className="h-5 w-5" />
            <span>Powered by BudgetWise AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Find the Perfect Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required. Cancel anytime.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Label htmlFor="pricing-toggle">Monthly</Label>
          <Switch id="pricing-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} />
          <Label htmlFor="pricing-toggle">Annual (Save 15%)</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-md mx-auto">
          {currentPlans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                plan.popular && 'border-primary shadow-lg'
              )}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg">
                  Best Value
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.priceSuffix}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleStartTrial(plan.id as PlanId)}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? 'Starting...' : 'Start 14-Day Free Trial'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <footer className="text-center text-muted-foreground text-sm pt-8">
          Built with ❤️ at Cloudflare
        </footer>
      </div>
    </div>
  );
}