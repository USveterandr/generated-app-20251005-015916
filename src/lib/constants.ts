import { Flame, Target, Zap, BarChart, Award, Coffee, ShoppingCart, Utensils, PiggyBank, TrendingUp, Flag } from 'lucide-react';
import { ClientAchievement, Achievement } from '@shared/types';
export const CATEGORY_ICONS: { [key: string]: React.ComponentType<any> } = {
  'Food & Drink': Utensils,
  'Shopping': ShoppingCart,
  'Transport': Zap,
  'Bills & Utilities': Zap,
  'Entertainment': Flame,
  'Health': PiggyBank,
  'Coffee': Coffee,
  'Groceries': ShoppingCart,
  'Savings': PiggyBank,
  'Tech Subscriptions': Zap,
  'Hardware': ShoppingCart,
  'Marketing': BarChart,
  'Office Supplies': ShoppingCart,
  'Travel': Flame,
  'Other': Target,
};
export const EXPENSE_CATEGORIES = [
  'Food & Drink',
  'Shopping',
  'Transport',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Coffee',
  'Groceries',
  'Savings',
  'Tech Subscriptions',
  'Hardware',
  'Marketing',
  'Office Supplies',
  'Travel',
  'Other',
];
export const ACHIEVEMENTS: ClientAchievement[] = [
  {
    id: 'first_expense',
    title: 'First Expense Logged',
    description: 'You\'re on your way to financial clarity.',
    icon: Award,
  },
  {
    id: '3_day_streak',
    title: '3-Day Streak',
    description: 'Consistency is building. Keep it up!',
    icon: Flame,
  },
  {
    id: '7_day_streak',
    title: '7-Day Streak',
    description: 'You\'ve made tracking a weekly habit!',
    icon: Flame,
  },
  {
    id: 'first_budget',
    title: 'Budget Setter',
    description: 'You\'ve set your first budget. Plan your success!',
    icon: Target,
  },
  {
    id: 'first_goal',
    title: 'Goal Setter',
    description: 'You\'ve set your first financial goal. Aim high!',
    icon: Flag,
  },
  {
    id: 'first_investment',
    title: 'Investor',
    description: 'You\'ve added your first investment. To the moon!',
    icon: TrendingUp,
  },
  {
    id: '10_transactions',
    title: 'Transaction Tracker',
    description: 'Logged 10 transactions. You\'re getting the hang of it!',
    icon: BarChart,
  },
  {
    id: 'over_achiever',
    title: 'Over Achiever',
    description: 'This is a locked achievement. How do you get it?',
    icon: Zap,
  },
];
// Backend-safe map of achievements without the icon component
export const ACHIEVEMENTS_MAP: { [key: string]: Achievement } = ACHIEVEMENTS.reduce((acc, ach) => {
  const { icon, ...rest } = ach;
  acc[ach.id] = rest;
  return acc;
}, {} as { [key: string]: Achievement });
export const ASSET_TYPES = [
  { id: 'stock', label: 'Stocks' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'other', label: 'Other' },
] as const;
export const POINTS_SYSTEM = {
  LOG_EXPENSE: 5,
  CREATE_BUDGET: 25,
  ADD_INVESTMENT: 50,
  CREATE_GOAL: 50,
};
export const FINANCIAL_TIERS = [
  { name: 'Novice', minPoints: 0 },
  { name: 'Adept', minPoints: 250 },
  { name: 'Pro', minPoints: 750 },
  { name: 'Expert', minPoints: 1500 },
  { name: 'Master', minPoints: 3000 },
];
export const PROFESSIONS = [
    { id: 'developer', label: 'Software Developer' },
    { id: 'designer', label: 'Designer / Creative' },
    { id: 'freelancer', label: 'Freelancer / Consultant' },
    { id: 'student', label: 'Student' },
    { id: 'other', label: 'Other' },
];
export const CATEGORY_TEMPLATES = {
    developer: ['Tech Subscriptions', 'Hardware', 'Coffee', 'Bills & Utilities'],
    designer: ['Tech Subscriptions', 'Shopping', 'Coffee', 'Entertainment'],
    freelancer: ['Marketing', 'Office Supplies', 'Travel', 'Tech Subscriptions'],
    student: ['Groceries', 'Transport', 'Entertainment', 'Shopping'],
    other: ['Food & Drink', 'Shopping', 'Bills & Utilities', 'Transport'],
};