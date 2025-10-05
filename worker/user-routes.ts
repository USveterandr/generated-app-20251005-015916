import { Hono } from "hono";
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { jwt, sign } from 'hono/jwt';
import type { Env } from './core-utils';
import { UserEntity, TransactionEntity, BudgetEntity, InvestmentEntity, GoalEntity, TeamEntity, TeamBudgetEntity, DocumentEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import { POINTS_SYSTEM, ACHIEVEMENTS_MAP, CATEGORY_TEMPLATES } from '../src/lib/constants';
import { hashPassword, verifyPassword } from './crypto-utils';
import type { Ai } from '@cloudflare/ai';
const JWT_SECRET = 'a-secure-secret-for-foresight-finance';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Public auth routes
  const authApp = new Hono<{ Bindings: Env }>();
  // POST /api/signup
  const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    initialBudget: z.object({
      category: z.string().min(1),
      limit: z.number().positive(),
    }).optional(),
    initialGoal: z.object({
      name: z.string().min(1),
      targetAmount: z.number().positive(),
      targetDate: z.string().min(1),
    }).optional(),
  });
  authApp.post('/signup', zValidator('json', signupSchema), async (c) => {
    const { name, email, password, initialBudget, initialGoal } = c.req.valid('json');
    const existingUser = await UserEntity.findByEmail(c.env, email);
    if (existingUser) {
      return bad(c, 'A user with this email already exists.');
    }
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const newUser = await UserEntity.create(c.env, {
      id: userId,
      name,
      email,
      passwordHash,
      streak: 0,
      points: 0,
      unlockedAchievementIds: [],
      subscriptionPlan: null,
      trialEndsAt: null,
      profession: null,
    });
    const userEntity = new UserEntity(c.env, userId);
    if (initialBudget) {
      const budgetData = { id: crypto.randomUUID(), userId, spent: 0, ...initialBudget };
      await BudgetEntity.create(c.env, budgetData);
      await userEntity.unlockAchievement('first_budget');
      await userEntity.addPoints(POINTS_SYSTEM.CREATE_BUDGET);
    }
    if (initialGoal) {
      const goalData = {
        id: crypto.randomUUID(),
        userId,
        currentAmount: 0,
        ...initialGoal,
        targetDate: new Date(initialGoal.targetDate).toISOString(),
      };
      await GoalEntity.create(c.env, goalData);
      await userEntity.unlockAchievement('first_goal');
      await userEntity.addPoints(POINTS_SYSTEM.CREATE_GOAL);
    }
    const finalUser = await userEntity.getState();
    const token = await sign({ sub: finalUser.id, name: finalUser.name }, JWT_SECRET);
    const { passwordHash: _, ...userWithoutPassword } = finalUser;
    return ok(c, { user: userWithoutPassword, token });
  });
  // POST /api/login
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });
  authApp.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const userEntity = await UserEntity.findByEmail(c.env, email);
    if (!userEntity) {
      return notFound(c, 'Invalid credentials.');
    }
    const user = await userEntity.getState();
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return notFound(c, 'Invalid credentials.');
    }
    const token = await sign({ sub: user.id, name: user.name }, JWT_SECRET);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return ok(c, { user: userWithoutPassword, token });
  });
  app.route('/api', authApp);
  // Protected routes
  const protectedApp = new Hono<{ Bindings: Env, Variables: { user: { sub: string } } }>();
  protectedApp.use('*', jwt({ secret: JWT_SECRET }));
  protectedApp.use('*', async (c, next) => {
    const payload = c.get('jwtPayload');
    if (!payload || !payload.sub) {
      return bad(c, 'Unauthorized');
    }
    c.set('user', { sub: payload.sub as string });
    await next();
  });
  // GET /api/dashboard
  protectedApp.get('/dashboard', async (c) => {
    const userId = c.get('user').sub;
    const userEntity = new UserEntity(c.env, userId);
    const userState = await userEntity.getState();
    const { passwordHash: _, ...user } = userState;
    const transactionPage = await TransactionEntity.list(c.env);
    const userTransactions = transactionPage.items
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentTransactions = userTransactions.slice(0, 5);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySpending = userTransactions
      .filter(t => new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    const budgetPage = await BudgetEntity.list(c.env);
    const userBudgets = budgetPage.items.filter(b => b.userId === userId);
    return ok(c, {
      user,
      monthlySpending,
      totalPoints: user.points,
      budgetSummary: userBudgets,
      recentTransactions,
    });
  });
  // POST /api/subscribe
  const subscribeSchema = z.object({
    plan: z.enum(['personal', 'investor', 'business']),
  });
  protectedApp.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
    const { plan } = c.req.valid('json');
    const userId = c.get('user').sub;
    const userEntity = new UserEntity(c.env, userId);
    const updatedUser = await userEntity.startTrial(plan);
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return ok(c, userWithoutPassword);
  });
  // POST /api/transactions
  const transactionSchema = z.object({
    amount: z.number(),
    category: z.string(),
    date: z.string().datetime({ message: "Invalid ISO 8601 date string" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid YYYY-MM-DD date string")),
    description: z.string().optional(),
  });
  protectedApp.post('/transactions', zValidator('json', transactionSchema), async (c) => {
    const data = c.req.valid('json');
    const userId = c.get('user').sub;
    const transactionData = {
      id: crypto.randomUUID(),
      userId,
      ...data,
      date: new Date(data.date).toISOString(),
    };
    const transaction = await TransactionEntity.create(c.env, transactionData);
    const userEntity = new UserEntity(c.env, userId);
    const user = await userEntity.getState();
    if (!user.unlockedAchievementIds.includes('first_expense')) {
      await userEntity.unlockAchievement('first_expense');
      transaction.unlockedAchievement = ACHIEVEMENTS_MAP.first_expense;
    }
    await userEntity.incrementStreak();
    await userEntity.addPoints(POINTS_SYSTEM.LOG_EXPENSE);
    return ok(c, transaction);
  });
  // GET /api/budgets
  protectedApp.get('/budgets', async (c) => {
    const userId = c.get('user').sub;
    const page = await BudgetEntity.list(c.env);
    const userBudgets = page.items.filter(b => b.userId === userId);
    return ok(c, userBudgets);
  });
  // POST /api/budgets
  const budgetSchema = z.object({
    category: z.string().min(1),
    limit: z.number().positive(),
  });
  protectedApp.post('/budgets', zValidator('json', budgetSchema), async (c) => {
    const data = c.req.valid('json');
    const userId = c.get('user').sub;
    const allBudgets = await BudgetEntity.list(c.env);
    const userBudgets = allBudgets.items.filter(b => b.userId === userId);
    if (userBudgets.find(b => b.category === data.category)) {
      return bad(c, `A budget for ${data.category} already exists.`);
    }
    const userEntity = new UserEntity(c.env, userId);
    const budgetData = { id: crypto.randomUUID(), userId, spent: 0, ...data };
    const budget = await BudgetEntity.create(c.env, budgetData);
    if (userBudgets.length === 0) {
      await userEntity.unlockAchievement('first_budget');
      budget.unlockedAchievement = ACHIEVEMENTS_MAP.first_budget;
    }
    await userEntity.addPoints(POINTS_SYSTEM.CREATE_BUDGET);
    return ok(c, budget);
  });
  // GET /api/investments
  protectedApp.get('/investments', async (c) => {
    const userId = c.get('user').sub;
    const page = await InvestmentEntity.list(c.env);
    const userInvestments = page.items.filter(i => i.userId === userId);
    return ok(c, userInvestments);
  });
  // POST /api/investments
  const investmentSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['stock', 'crypto', 'real_estate', 'other']),
    quantity: z.number().positive(),
    currentValue: z.number().positive(),
  });
  protectedApp.post('/investments', zValidator('json', investmentSchema), async (c) => {
    const data = c.req.valid('json');
    const userId = c.get('user').sub;
    const allInvestments = await InvestmentEntity.list(c.env);
    const userInvestments = allInvestments.items.filter(i => i.userId === userId);
    const userEntity = new UserEntity(c.env, userId);
    const investmentData = { id: crypto.randomUUID(), userId, ...data };
    const investment = await InvestmentEntity.create(c.env, investmentData);
    if (userInvestments.length === 0) {
      await userEntity.unlockAchievement('first_investment');
      investment.unlockedAchievement = ACHIEVEMENTS_MAP.first_investment;
    }
    await userEntity.addPoints(POINTS_SYSTEM.ADD_INVESTMENT);
    return ok(c, investment);
  });
  // PUT /api/user
  const userUpdateSchema = z.object({
    name: z.string().min(1, 'Name cannot be empty'),
    profession: z.string().optional(),
  });
  protectedApp.put('/user', zValidator('json', userUpdateSchema), async (c) => {
    const data = c.req.valid('json');
    const userId = c.get('user').sub;
    const userEntity = new UserEntity(c.env, userId);
    const updatedUser = await userEntity.updateProfile(data);
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return ok(c, userWithoutPassword);
  });
  // POST /api/user/apply-template
  const applyTemplateSchema = z.object({
    profession: z.string().min(1, 'Profession is required'),
  });
  protectedApp.post('/user/apply-template', zValidator('json', applyTemplateSchema), async (c) => {
    const { profession } = c.req.valid('json');
    const userId = c.get('user').sub;
    const templateCategories = CATEGORY_TEMPLATES[profession as keyof typeof CATEGORY_TEMPLATES];
    if (!templateCategories) {
      return bad(c, 'Invalid profession template.');
    }
    const { items: existingBudgets } = await BudgetEntity.list(c.env);
    const userBudgets = existingBudgets.filter(b => b.userId === userId);
    const existingCategories = new Set(userBudgets.map(b => b.category));
    const newCategories = templateCategories.filter(cat => !existingCategories.has(cat));
    if (newCategories.length === 0) {
      return ok(c, { message: 'All template categories already exist in your budgets.' });
    }
    const newBudgets = [];
    for (const category of newCategories) {
      const budgetData = {
        id: crypto.randomUUID(),
        userId,
        category,
        limit: 0, // Users should set their own limits
        spent: 0,
      };
      const newBudget = await BudgetEntity.create(c.env, budgetData);
      newBudgets.push(newBudget);
    }
    return ok(c, { message: `Added ${newBudgets.length} new budget categories.`, newBudgets });
  });
  // GET /api/goals
  protectedApp.get('/goals', async (c) => {
    const userId = c.get('user').sub;
    const page = await GoalEntity.list(c.env);
    const userGoals = page.items.filter(g => g.userId === userId);
    return ok(c, userGoals);
  });
  // POST /api/goals
  const goalSchema = z.object({
    name: z.string().min(1, 'Goal name is required'),
    targetAmount: z.number().positive('Target amount must be positive'),
    targetDate: z.string().min(1, 'Target date is required'),
  });
  protectedApp.post('/goals', zValidator('json', goalSchema), async (c) => {
    const data = c.req.valid('json');
    const userId = c.get('user').sub;
    const allGoals = await GoalEntity.list(c.env);
    const userGoals = allGoals.items.filter(g => g.userId === userId);
    const userEntity = new UserEntity(c.env, userId);
    const goalData = {
      id: crypto.randomUUID(),
      userId,
      currentAmount: 0,
      ...data,
      targetDate: new Date(data.targetDate).toISOString(),
    };
    const goal = await GoalEntity.create(c.env, goalData);
    if (userGoals.length === 0) {
      await userEntity.unlockAchievement('first_goal');
      goal.unlockedAchievement = ACHIEVEMENTS_MAP.first_goal;
    }
    await userEntity.addPoints(POINTS_SYSTEM.CREATE_GOAL);
    return ok(c, goal);
  });
  // POST /api/ai/chat
  const aiChatSchema = z.object({ query: z.string().min(1, 'Query cannot be empty') });
  protectedApp.post('/ai/chat', zValidator('json', aiChatSchema), async (c) => {
    const { query } = c.req.valid('json');
    const userId = c.get('user').sub;
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('goal') || lowerQuery.includes('saving')) {
        const { items: userGoals } = await GoalEntity.list(c.env);
        const goals = userGoals.filter(g => g.userId === userId);
        if (goals.length > 0) {
            const goal = goals[0];
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return ok(c, { response: `For your goal "${goal.name}", you have saved ${goal.currentAmount.toFixed(2)} of your ${goal.targetAmount.toFixed(2)} target (${progress.toFixed(1)}% complete).` });
        }
        return ok(c, { response: "You haven't set any goals yet. You can create one on the Goals page." });
    }
    const transactionPage = await TransactionEntity.list(c.env);
    const userTransactions = transactionPage.items.filter(t => t.userId === userId);
    if (lowerQuery.includes('biggest expense')) {
      const spendingByCategory: { [key: string]: number } = {};
      userTransactions.forEach(t => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });
      const biggestCategory = Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1])[0];
      if (biggestCategory) {
        return ok(c, { response: `Your biggest spending category is ${biggestCategory[0]} with a total of ${biggestCategory[1].toFixed(2)}.` });
      }
    }
    return ok(c, { response: "I can answer questions about your spending and goals. Try asking 'What is my biggest expense?' or 'How am I doing on my goals?'" });
  });
  // GET /api/teams
  protectedApp.get('/teams', async (c) => {
    const userId = c.get('user').sub;
    const { items: allTeams } = await TeamEntity.list(c.env);
    const userTeams = allTeams.filter(team => team.memberIds.includes(userId) || team.ownerId === userId);
    return ok(c, userTeams);
  });
  // POST /api/teams
  const teamSchema = z.object({
    name: z.string().min(3, 'Team name must be at least 3 characters'),
  });
  protectedApp.post('/teams', zValidator('json', teamSchema), async (c) => {
    const { name } = c.req.valid('json');
    const userId = c.get('user').sub;
    const teamData = {
      id: crypto.randomUUID(),
      name,
      ownerId: userId,
      memberIds: [userId],
    };
    const team = await TeamEntity.create(c.env, teamData);
    return ok(c, team);
  });
  // POST /api/teams/:teamId/invite
  const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
  });
  protectedApp.post('/teams/:teamId/invite', zValidator('json', inviteSchema), async (c) => {
    const { teamId } = c.req.param();
    const { email } = c.req.valid('json');
    const currentUserId = c.get('user').sub;
    const teamEntity = new TeamEntity(c.env, teamId);
    const team = await teamEntity.getState();
    if (team.ownerId !== currentUserId) {
      return bad(c, 'Only the team owner can invite members.');
    }
    const userToInvite = await UserEntity.findByEmail(c.env, email);
    if (!userToInvite) {
      return notFound(c, 'User with this email not found.');
    }
    const invitedUserId = userToInvite.id;
    if (team.memberIds.includes(invitedUserId)) {
      return bad(c, 'This user is already a member of the team.');
    }
    const updatedTeam = await teamEntity.addMember(invitedUserId);
    return ok(c, updatedTeam);
  });
  // GET /api/teams/:teamId/dashboard
  protectedApp.get('/teams/:teamId/dashboard', async (c) => {
    const { teamId } = c.req.param();
    const currentUserId = c.get('user').sub;
    const teamEntity = new TeamEntity(c.env, teamId);
    const team = await teamEntity.getState();
    if (!team.memberIds.includes(currentUserId)) {
      return bad(c, 'You are not a member of this team.');
    }
    const { items: allTransactions } = await TransactionEntity.list(c.env);
    const teamTransactions = allTransactions.filter(t => team.memberIds.includes(t.userId));
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySpending = teamTransactions
      .filter(t => new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    const recentTransactions = teamTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    const { items: allTeamBudgets } = await TeamBudgetEntity.list(c.env);
    const teamBudgets = allTeamBudgets.filter(tb => tb.teamId === teamId);
    return ok(c, {
      team,
      monthlySpending,
      recentTransactions,
      teamBudgets,
    });
  });
  // GET /api/teams/:teamId/budgets
  protectedApp.get('/teams/:teamId/budgets', async (c) => {
    const { teamId } = c.req.param();
    const { items: allTeamBudgets } = await TeamBudgetEntity.list(c.env);
    const teamBudgets = allTeamBudgets.filter(tb => tb.teamId === teamId);
    return ok(c, teamBudgets);
  });
  // POST /api/teams/:teamId/budgets
  protectedApp.post('/teams/:teamId/budgets', zValidator('json', budgetSchema), async (c) => {
    const { teamId } = c.req.param();
    const data = c.req.valid('json');
    const currentUserId = c.get('user').sub;
    const teamEntity = new TeamEntity(c.env, teamId);
    const team = await teamEntity.getState();
    if (team.ownerId !== currentUserId) {
      return bad(c, 'Only the team owner can create budgets.');
    }
    const { items: allTeamBudgets } = await TeamBudgetEntity.list(c.env);
    const teamBudgets = allTeamBudgets.filter(tb => tb.teamId === teamId);
    if (teamBudgets.find(b => b.category === data.category)) {
      return bad(c, `A budget for ${data.category} already exists for this team.`);
    }
    const budgetData = { id: crypto.randomUUID(), teamId, spent: 0, ...data };
    const budget = await TeamBudgetEntity.create(c.env, budgetData);
    return ok(c, budget);
  });
  // POST /api/teams/:teamId/receipts
  protectedApp.post('/teams/:teamId/receipts', async (c) => {
    const { teamId } = c.req.param();
    const currentUserId = c.get('user').sub;
    const formData = await c.req.formData();
    const file = formData.get('receipt') as File;
    const vendor = formData.get('vendor') as string;
    if (!file) return bad(c, 'Receipt file is required.');
    if (!c.env.R2_BUCKET) return bad(c, 'R2 bucket is not configured.');
    if (!c.env.AI) return bad(c, 'AI service is not configured.');
    const documentId = crypto.randomUUID();
    const r2Key = `${teamId}/${documentId}/${file.name}`;
    await c.env.R2_BUCKET.put(r2Key, file.stream());
    const docData = {
      id: documentId,
      userId: currentUserId,
      teamId,
      fileName: file.name,
      fileType: file.type,
      r2Key,
      status: 'Processing' as const,
      uploadDate: new Date().toISOString(),
    };
    const docEntity = await DocumentEntity.create(c.env, docData);
    // Asynchronously process the receipt with AI
    c.executionCtx.waitUntil((async () => {
      try {
        if (file.type.startsWith('image/')) {
          const imageBuffer = await file.arrayBuffer();
          const inputs = { image: [...new Uint8Array(imageBuffer)] };
          const response: any = await c.env.AI.run('@cf/unum/uform-gen2-qwen-500m', inputs);
          const content = response.description?.[0];
          if (content) {
            const amountMatch = content.match(/total.*?([\d,]+\.\d{2})/i);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : parseFloat(formData.get('amount') as string);
            if (!isNaN(amount)) {
              await TransactionEntity.create(c.env, {
                id: crypto.randomUUID(),
                userId: currentUserId,
                amount,
                category: 'Uncategorized',
                date: new Date().toISOString(),
                description: `Receipt: ${vendor || file.name}`,
              });
            }
          }
        }
        await new DocumentEntity(c.env, documentId).updateStatus('Processed');
      } catch (e) {
        console.error('AI processing failed:', e);
        await new DocumentEntity(c.env, documentId).updateStatus('Failed');
      }
    })());
    return ok(c, docEntity);
  });
  // GET /api/documents/:teamId
  protectedApp.get('/documents/:teamId', async (c) => {
    const { teamId } = c.req.param();
    const { items: allDocs } = await DocumentEntity.list(c.env);
    const teamDocs = allDocs.filter(d => d.teamId === teamId).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    return ok(c, teamDocs);
  });
  // GET /api/documents
  protectedApp.get('/documents', async (c) => {
    const userId = c.get('user').sub;
    const { items: allTeams } = await TeamEntity.list(c.env);
    const userTeamIds = allTeams
      .filter(team => team.memberIds.includes(userId))
      .map(team => team.id);
    const { items: allDocs } = await DocumentEntity.list(c.env);
    const userDocs = allDocs
      .filter(doc => userTeamIds.includes(doc.teamId))
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    return ok(c, userDocs);
  });
  // GET /api/reports/sankey
  protectedApp.get('/reports/sankey', async (c) => {
    const userId = c.get('user').sub;
    const { items: transactions } = await TransactionEntity.list(c.env);
    const userTransactions = transactions.filter(t => t.userId === userId);
    const nodes: { name: string }[] = [{ name: 'Total Income' }];
    const links: { source: number; target: number; value: number }[] = [];
    const categoryMap: { [key: string]: number } = {};
    let totalSpending = 0;
    userTransactions.forEach(t => {
      if (t.amount > 0) { // Assuming positive amounts are expenses
        if (!(t.category in categoryMap)) {
          categoryMap[t.category] = nodes.length;
          nodes.push({ name: t.category });
        }
        const targetIndex = categoryMap[t.category];
        links.push({ source: 0, target: targetIndex, value: t.amount });
        totalSpending += t.amount;
      }
    });
    // For simplicity, we assume income is just the sum of all expenses.
    // A real app would track income separately.
    if (totalSpending > 0) {
      nodes[0].name = `Total Income (${totalSpending.toFixed(2)})`;
    }
    return ok(c, { nodes, links });
  });
  app.route('/api', protectedApp);
}