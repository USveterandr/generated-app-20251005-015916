import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { runMonteCarloSimulation, SimulationResult } from '@/lib/montecarlo';
import { RetirementChart } from '@/components/RetirementChart';
import { Bot, Loader2 } from 'lucide-react';
const simulatorSchema = z.object({
  initialAge: z.coerce.number().min(18).max(90),
  retirementAge: z.coerce.number().min(19).max(100),
  initialPortfolioValue: z.coerce.number().min(0),
  monthlyContribution: z.coerce.number().min(0),
  meanReturn: z.coerce.number().min(0).max(20),
  stdDev: z.coerce.number().min(0).max(40),
}).refine(data => data.retirementAge > data.initialAge, {
  message: "Retirement age must be greater than current age.",
  path: ["retirementAge"],
});
type SimulatorFormData = z.infer<typeof simulatorSchema>;
export function RetirementSimulatorPage() {
  const [simulationResult, setSimulationResult] = useState<SimulationResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SimulatorFormData>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: {
      initialAge: 30,
      retirementAge: 65,
      initialPortfolioValue: 50000,
      monthlyContribution: 500,
      meanReturn: 7,
      stdDev: 15,
    },
  });
  const meanReturn = watch('meanReturn');
  const stdDev = watch('stdDev');
  const onSubmit: SubmitHandler<SimulatorFormData> = (data) => {
    setIsLoading(true);
    setSimulationResult(null);
    // Simulate a delay for a better user experience
    setTimeout(() => {
      const result = runMonteCarloSimulation({
        ...data,
        meanReturn: data.meanReturn / 100,
        stdDev: data.stdDev / 100,
      });
      setSimulationResult(result);
      setIsLoading(false);
    }, 500);
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monte Carlo Retirement Simulator</h1>
        <p className="text-muted-foreground">
          Forecast your retirement portfolio's potential growth under various market conditions.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Simulation Inputs</CardTitle>
            <CardDescription>Adjust the parameters to match your financial situation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialAge">Current Age</Label>
                  <Input id="initialAge" type="number" {...register('initialAge')} />
                  {errors.initialAge && <p className="text-xs text-destructive mt-1">{errors.initialAge.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retirementAge">Retirement Age</Label>
                  <Input id="retirementAge" type="number" {...register('retirementAge')} />
                  {errors.retirementAge && <p className="text-xs text-destructive mt-1">{errors.retirementAge.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialPortfolioValue">Initial Investment ($)</Label>
                <Input id="initialPortfolioValue" type="number" {...register('initialPortfolioValue')} />
                {errors.initialPortfolioValue && <p className="text-xs text-destructive mt-1">{errors.initialPortfolioValue.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label>
                <Input id="monthlyContribution" type="number" {...register('monthlyContribution')} />
                {errors.monthlyContribution && <p className="text-xs text-destructive mt-1">{errors.monthlyContribution.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Expected Annual Return ({meanReturn}%)</Label>
                <Slider defaultValue={[7]} max={20} step={0.5} onValueChange={(v) => setValue('meanReturn', v[0])} />
              </div>
              <div className="space-y-2">
                <Label>Volatility (Std. Dev. {stdDev}%)</Label>
                <Slider defaultValue={[15]} max={40} step={0.5} onValueChange={(v) => setValue('stdDev', v[0])} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Run Simulation
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Retirement Projection</CardTitle>
            <CardDescription>
              Inflation-adjusted portfolio value over time based on 1,000 simulations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {simulationResult && simulationResult.length > 0 && <RetirementChart data={simulationResult} />}
            {!simulationResult && !isLoading && (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your simulation results will appear here.</p>
                <p className="text-sm text-muted-foreground">Adjust your inputs and run the simulation.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}