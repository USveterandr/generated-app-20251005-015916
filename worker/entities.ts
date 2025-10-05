import { IndexedEntity, Env, Index, CtorAny, HS, IS } from "./core-utils";
import type { User, Budget, Transaction, Investment, Goal, Team, TeamBudget, Document } from "@shared/types";
interface UserWithPassword extends User {
  passwordHash: string;
}
export class UserEntity extends IndexedEntity<UserWithPassword> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: UserWithPassword = {
    id: "",
    name: "",
    email: "",
    passwordHash: "",
    streak: 0,
    points: 0,
    unlockedAchievementIds: [],
    subscriptionPlan: null,
    trialEndsAt: null,
    profession: null,
  };
  static async findByEmail(env: Env, email: string): Promise<UserEntity | null> {
    const { items: allUsers } = await this.list(env);
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return foundUser ? new UserEntity(env, foundUser.id) : null;
  }
  static async create<TCtor extends CtorAny>(this: HS<TCtor>, env: Env, state: IS<TCtor>): Promise<IS<TCtor>> {
    const user = await super.create(env, state);
    return user;
  }
  async incrementStreak(): Promise<number> {
    const { streak } = await this.mutate(s => ({ ...s, streak: s.streak + 1 }));
    return streak;
  }
  async unlockAchievement(achievementId: string): Promise<string[]> {
    const { unlockedAchievementIds } = await this.mutate(s => {
      const newSet = new Set(s.unlockedAchievementIds);
      newSet.add(achievementId);
      return { ...s, unlockedAchievementIds: Array.from(newSet) };
    });
    return unlockedAchievementIds;
  }
  async updateProfile(data: { name: string; profession?: string }): Promise<UserWithPassword> {
    return this.mutate(s => ({ ...s, name: data.name, profession: data.profession || s.profession }));
  }
  async addPoints(pointsToAdd: number): Promise<number> {
    const { points } = await this.mutate(s => ({ ...s, points: s.points + pointsToAdd }));
    return points;
  }
  async startTrial(plan: 'personal' | 'investor' | 'business'): Promise<UserWithPassword> {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    return this.mutate(s => ({
      ...s,
      subscriptionPlan: plan,
      trialEndsAt: trialEndDate.toISOString(),
    }));
  }
}
// TRANSACTION ENTITY
export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = { id: "", userId: "", amount: 0, category: "", date: "" };
  static async create<TCtor extends CtorAny>(this: HS<TCtor>, env: Env, state: IS<TCtor>): Promise<IS<TCtor>> {
    const transaction = (await super.create(env, state) as unknown) as Transaction;
    // Update personal budget
    const { items: allBudgets } = await BudgetEntity.list(env);
    const budgetForCategory = allBudgets.find(b => b.userId === transaction.userId && b.category === transaction.category);
    if (budgetForCategory) {
      const budgetEntity = new BudgetEntity(env, budgetForCategory.id);
      await budgetEntity.updateSpentAmount(transaction.amount);
    }
    // Update team budget
    const { items: allTeams } = await TeamEntity.list(env);
    const userTeams = allTeams.filter(t => t.memberIds.includes(transaction.userId));
    if (userTeams.length > 0) {
        const { items: allTeamBudgets } = await TeamBudgetEntity.list(env);
        for (const team of userTeams) {
            const teamBudget = allTeamBudgets.find(tb => tb.teamId === team.id && tb.category === transaction.category);
            if (teamBudget) {
                const teamBudgetEntity = new TeamBudgetEntity(env, teamBudget.id);
                await teamBudgetEntity.updateSpentAmount(transaction.amount);
            }
        }
    }
    // Update savings goal
    if (transaction.category === 'Savings') {
        const { items: allGoals } = await GoalEntity.list(env);
        const savingsGoal = allGoals.find(g => g.userId === transaction.userId && g.name.toLowerCase().includes('saving'));
        if (savingsGoal) {
            const goalEntity = new GoalEntity(env, savingsGoal.id);
            await goalEntity.updateCurrentAmount(transaction.amount);
        }
    }
    return (transaction as unknown) as IS<TCtor>;
  }
}
// BUDGET ENTITY
export class BudgetEntity extends IndexedEntity<Budget> {
  static readonly entityName = "budget";
  static readonly indexName = "budgets";
  static readonly initialState: Budget = { id: "", userId: "", category: "", limit: 0, spent: 0 };
  async updateSpentAmount(amount: number): Promise<Budget> {
    return this.mutate(s => ({ ...s, spent: s.spent + amount }));
  }
}
// INVESTMENT ENTITY
export class InvestmentEntity extends IndexedEntity<Investment> {
  static readonly entityName = "investment";
  static readonly indexName = "investments";
  static readonly initialState: Investment = {
    id: "",
    userId: "",
    type: "other",
    name: "",
    quantity: 0,
    currentValue: 0,
  };
}
// GOAL ENTITY
export class GoalEntity extends IndexedEntity<Goal> {
  static readonly entityName = "goal";
  static readonly indexName = "goals";
  static readonly initialState: Goal = {
    id: "",
    userId: "",
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    targetDate: "",
  };
  async updateCurrentAmount(amount: number): Promise<Goal> {
    return this.mutate(s => ({ ...s, currentAmount: s.currentAmount + amount }));
  }
}
// TEAM ENTITY
export class TeamEntity extends IndexedEntity<Team> {
  static readonly entityName = "team";
  static readonly indexName = "teams";
  static readonly initialState: Team = {
    id: "",
    name: "",
    ownerId: "",
    memberIds: [],
  };
  async addMember(userId: string): Promise<Team> {
    return this.mutate(s => {
      const newMemberIds = new Set(s.memberIds);
      newMemberIds.add(userId);
      return { ...s, memberIds: Array.from(newMemberIds) };
    });
  }
}
// TEAM BUDGET ENTITY
export class TeamBudgetEntity extends IndexedEntity<TeamBudget> {
  static readonly entityName = "teamBudget";
  static readonly indexName = "teamBudgets";
  static readonly initialState: TeamBudget = { id: "", teamId: "", category: "", limit: 0, spent: 0 };
  async updateSpentAmount(amount: number): Promise<TeamBudget> {
    return this.mutate(s => ({ ...s, spent: s.spent + amount }));
  }
}
// DOCUMENT ENTITY
export class DocumentEntity extends IndexedEntity<Document> {
  static readonly entityName = "document";
  static readonly indexName = "documents";
  static readonly initialState: Document = {
    id: "",
    userId: "",
    teamId: "",
    fileName: "",
    fileType: "",
    r2Key: "",
    status: "Processing",
    uploadDate: "",
  };
  async updateStatus(status: 'Processed' | 'Failed'): Promise<Document> {
    return this.mutate(s => ({ ...s, status }));
  }
}