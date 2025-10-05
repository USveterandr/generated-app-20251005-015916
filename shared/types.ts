import { LucideIcon } from 'lucide-react';
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  streak: number;
  points: number;
  unlockedAchievementIds: string[];
  subscriptionPlan: 'personal' | 'investor' | 'business' | null;
  trialEndsAt: string | null;
  profession: string | null;
}
// This is a client-side only version of Achievement
export interface ClientAchievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}
// This is a backend-safe version of Achievement
export interface Achievement {
    id: string;
    title: string;
    description: string;
}
export interface Transaction {
  id:string;
  userId: string;
  amount: number;
  category: string;
  date: string; // ISO 8601 string
  description?: string;
  unlockedAchievement?: Achievement;
}
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  unlockedAchievement?: Achievement;
}
export interface Investment {
  id: string;
  userId: string;
  type: 'stock' | 'crypto' | 'real_estate' | 'other';
  name: string;
  quantity: number;
  currentValue: number;
  unlockedAchievement?: Achievement;
}
export interface Goal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string; // ISO 8601 string
    unlockedAchievement?: Achievement;
}
export interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
}
export interface TeamBudget {
  id: string;
  teamId: string;
  category: string;
  limit: number;
  spent: number;
}
export interface Document {
  id: string;
  userId: string; // The user who uploaded the document
  teamId: string;
  fileName: string;
  fileType: string;
  r2Key: string;
  status: 'Processing' | 'Processed' | 'Failed';
  uploadDate: string; // ISO 8601 string
}
export interface DashboardData {
  user: User;
  monthlySpending: number;
  totalPoints: number;
  budgetSummary: Budget[];
  recentTransactions: Transaction[];
}
export interface TeamDashboardData {
  team: Team;
  monthlySpending: number;
  recentTransactions: Transaction[];
  teamBudgets: TeamBudget[];
}
export interface SankeyNode {
  name: string;
}
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}