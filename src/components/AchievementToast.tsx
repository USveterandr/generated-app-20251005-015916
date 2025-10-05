import { Trophy } from 'lucide-react';
import { ClientAchievement } from '@shared/types';
interface AchievementToastProps {
  achievement: ClientAchievement;
}
export function AchievementToast({ achievement }: AchievementToastProps) {
  const { icon: Icon, title, description } = achievement;
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
        <Trophy className="h-6 w-6 text-yellow-500" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">Achievement Unlocked!</p>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}