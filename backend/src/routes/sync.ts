import { Router, Request, Response } from 'express';
import { io } from '../server';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

export const syncRouter = Router();

// File path for disk backup of shared state
const DATA_FILE = path.join(__dirname, '..', '..', 'shared-state.json');

const now = new Date().toISOString();

const defaultProject = {
  id: 'proj-001',
  name: 'Mijn Project',
  description: '',
  address: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  totalBudget: 0,
  currency: 'EUR',
  createdAt: now,
  updatedAt: now,
};

// In-memory state store with persistent synchronization across all clients
let sharedState: {
  project?: any;
  subprojects: any[];
  tasks: any[];
  persons: any[];
  materials: any[];
  comments: any[];
  budgetLines: any[];
  users: any[];
  expenses: any[];
  availableUpgrades?: any[];
  projectUpgrades?: any[];
  lastUpdated: string;
} = {
  project: defaultProject,
  subprojects: [],
  tasks: [],
  persons: [],
  materials: [],
  comments: [],
  budgetLines: [],
  users: [],
  expenses: [],
  availableUpgrades: [],
  projectUpgrades: [],
  lastUpdated: new Date().toISOString(),
};

// Load saved state from disk if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      sharedState = {
        ...sharedState,
        ...parsed,
        project: parsed.project || defaultProject,
        subprojects: Array.isArray(parsed.subprojects) ? parsed.subprojects : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        persons: Array.isArray(parsed.persons) ? parsed.persons : [],
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        budgetLines: Array.isArray(parsed.budgetLines) ? parsed.budgetLines : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        availableUpgrades: Array.isArray(parsed.availableUpgrades) ? parsed.availableUpgrades : [],
        projectUpgrades: Array.isArray(parsed.projectUpgrades) ? parsed.projectUpgrades : [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
      console.log(`[Sync] Loaded shared state from disk (${sharedState.tasks.length} tasks, ${sharedState.subprojects.length} subprojects)`);
    }
  }
} catch (e) {
  console.warn('[Sync] Failed to load shared-state.json:', e);
}

// Attempt to load from PostgreSQL Prisma DB if connected
async function tryLoadFromPrisma() {
  try {
    const project = await prisma.project.findFirst({
      include: {
        subprojects: { orderBy: { order: 'asc' } },
      },
    });

    if (project) {
      const tasks = await prisma.task.findMany({
        include: {
          assignees: { include: { person: true } },
          dependsOn: true,
        },
        orderBy: { order: 'asc' },
      });

      const persons = await prisma.person.findMany();
      const users = await prisma.user.findMany();
      const materials = await prisma.material.findMany();
      const comments = await prisma.comment.findMany();
      const budgetLines = await prisma.budgetLine.findMany();
      const expenses = await prisma.paymentExpense.findMany({
        orderBy: { date: 'desc' },
      });

      sharedState.project = project;
      if (project.subprojects && project.subprojects.length > 0) {
        sharedState.subprojects = project.subprojects;
      }
      if (tasks && tasks.length > 0) {
        sharedState.tasks = tasks.map((t) => ({
          ...t,
          assigneeIds: t.assignees.map((a) => a.personId),
          dependencies: t.dependsOn.map((d) => d.prerequisiteTaskId),
        }));
      }
      if (persons && persons.length > 0) sharedState.persons = persons;
      if (users && users.length > 0) sharedState.users = users;
      if (materials && materials.length > 0) sharedState.materials = materials;
      if (comments && comments.length > 0) sharedState.comments = comments;
      if (budgetLines && budgetLines.length > 0) sharedState.budgetLines = budgetLines;
      if (expenses && expenses.length > 0) sharedState.expenses = expenses;

      console.log(`[Sync] Synced with Prisma PostgreSQL (${sharedState.tasks.length} tasks, ${sharedState.subprojects.length} subprojects)`);
      persistSharedStateToDisk();
    }
  } catch (err) {
    // Database not running locally or table empty, proceed with in-memory/disk store
  }
}
tryLoadFromPrisma();

let saveTimeout: any = null;
function persistSharedStateToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(sharedState, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Sync] Could not save state to disk:', err);
    }
  }, 300);
}

/**
 * Merge two arrays of entities by their `id` property.
 */
export function mergeEntitiesById<T extends { id?: string; updatedAt?: string; createdAt?: string }>(
  existingList: T[],
  incomingList: T[]
): T[] {
  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return existingList || [];
  }
  if (!Array.isArray(existingList) || existingList.length === 0) {
    return incomingList;
  }

  const map = new Map<string, T>();
  for (const item of existingList) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  for (const incoming of incomingList) {
    if (!incoming || !incoming.id) continue;
    const current = map.get(incoming.id);
    if (!current) {
      map.set(incoming.id, incoming);
    } else {
      const curTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
      const incTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;
      if (incTime >= curTime) {
        map.set(incoming.id, { ...current, ...incoming });
      } else {
        map.set(incoming.id, { ...incoming, ...current });
      }
    }
  }

  return Array.from(map.values());
}

export function getSharedState() {
  return sharedState;
}

export function updateSharedState(updates: Partial<typeof sharedState>) {
  if (!updates || typeof updates !== 'object') return sharedState;

  if (updates.project !== undefined && updates.project !== null) {
    sharedState.project = updates.project;
  }

  if (Array.isArray(updates.subprojects)) {
    sharedState.subprojects = updates.subprojects;
  }
  if (Array.isArray(updates.tasks)) {
    sharedState.tasks = updates.tasks;
  }
  if (Array.isArray(updates.persons)) {
    sharedState.persons = updates.persons;
  }
  if (Array.isArray(updates.materials)) {
    sharedState.materials = updates.materials;
  }
  if (Array.isArray(updates.comments)) {
    sharedState.comments = updates.comments;
  }
  if (Array.isArray(updates.budgetLines)) {
    sharedState.budgetLines = updates.budgetLines;
  }
  if (Array.isArray(updates.users)) {
    sharedState.users = updates.users;
  }
  if (Array.isArray(updates.expenses)) {
    sharedState.expenses = updates.expenses;
  }
  if (Array.isArray(updates.availableUpgrades)) {
    sharedState.availableUpgrades = updates.availableUpgrades;
  }
  if (Array.isArray(updates.projectUpgrades)) {
    sharedState.projectUpgrades = updates.projectUpgrades;
  }

  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();

  // Async sync to Railway PostgreSQL
  syncToPrismaDb(updates).catch(() => {});

  return sharedState;
}

async function syncToPrismaDb(updates: Partial<typeof sharedState>) {
  try {
    if (updates.project && updates.project.id) {
      await prisma.project.upsert({
        where: { id: updates.project.id },
        update: {
          name: updates.project.name || 'Mijn Project',
          description: updates.project.description || '',
          address: updates.project.address || '',
          startDate: updates.project.startDate || new Date().toISOString().split('T')[0],
          endDate: updates.project.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalBudget: updates.project.totalBudget || 0,
          currency: updates.project.currency || 'EUR',
        },
        create: {
          id: updates.project.id,
          name: updates.project.name || 'Mijn Project',
          description: updates.project.description || '',
          address: updates.project.address || '',
          startDate: updates.project.startDate || new Date().toISOString().split('T')[0],
          endDate: updates.project.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalBudget: updates.project.totalBudget || 0,
          currency: updates.project.currency || 'EUR',
        },
      });
    }

    if (Array.isArray(updates.subprojects)) {
      const projId = updates.project?.id || sharedState.project?.id || 'proj-001';
      for (const sp of updates.subprojects) {
        if (!sp || !sp.id) continue;
        await prisma.subproject.upsert({
          where: { id: sp.id },
          update: {
            name: sp.name,
            description: sp.description || '',
            color: sp.color || 'blue',
            startDate: sp.startDate || new Date().toISOString().split('T')[0],
            endDate: sp.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCollapsed: sp.isCollapsed ?? false,
            order: sp.order ?? 0,
          },
          create: {
            id: sp.id,
            projectId: projId,
            name: sp.name,
            description: sp.description || '',
            color: sp.color || 'blue',
            startDate: sp.startDate || new Date().toISOString().split('T')[0],
            endDate: sp.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCollapsed: sp.isCollapsed ?? false,
            order: sp.order ?? 0,
          },
        });
      }
    }

    if (Array.isArray(updates.tasks)) {
      for (const t of updates.tasks) {
        if (!t || !t.id || !t.subprojectId) continue;
        await prisma.task.upsert({
          where: { id: t.id },
          update: {
            title: t.title,
            description: t.description || '',
            status: t.status || 'todo',
            priority: t.priority || 'medium',
            startDate: t.startDate || new Date().toISOString().split('T')[0],
            endDate: t.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: t.progress ?? 0,
            isCompleted: t.isCompleted ?? false,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            order: t.order ?? 0,
            tags: t.tags ?? [],
          },
          create: {
            id: t.id,
            subprojectId: t.subprojectId,
            title: t.title,
            description: t.description || '',
            status: t.status || 'todo',
            priority: t.priority || 'medium',
            startDate: t.startDate || new Date().toISOString().split('T')[0],
            endDate: t.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: t.progress ?? 0,
            isCompleted: t.isCompleted ?? false,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            order: t.order ?? 0,
            tags: t.tags ?? [],
          },
        });
      }
    }

    if (Array.isArray(updates.expenses)) {
      for (const e of updates.expenses) {
        if (!e || !e.id) continue;
        await prisma.paymentExpense.upsert({
          where: { id: e.id },
          update: {
            title: e.title,
            amount: e.amount || 0,
            category: e.category || 'materials',
            paidByUserId: e.paidByUserId || '',
            paidByUserName: e.paidByUserName || '',
            splitAmongUserIds: e.splitAmongUserIds || [],
            subprojectId: e.subprojectId || null,
            taskId: e.taskId || null,
            date: e.date || new Date().toISOString().split('T')[0],
            receiptImage: e.receiptImage || null,
            receiptThumbnail: e.receiptThumbnail || null,
            notes: e.notes || null,
          },
          create: {
            id: e.id,
            title: e.title,
            amount: e.amount || 0,
            category: e.category || 'materials',
            paidByUserId: e.paidByUserId || '',
            paidByUserName: e.paidByUserName || '',
            splitAmongUserIds: e.splitAmongUserIds || [],
            subprojectId: e.subprojectId || null,
            taskId: e.taskId || null,
            date: e.date || new Date().toISOString().split('T')[0],
            receiptImage: e.receiptImage || null,
            receiptThumbnail: e.receiptThumbnail || null,
            notes: e.notes || null,
          },
        });
      }
    }
  } catch (err) {
    // Silently ignore if Railway DB is momentarily unreachable
  }
}

export function addOrUpdateExpenseInState(expense: any) {
  if (!expense || !expense.id) return;
  const existingIdx = sharedState.expenses.findIndex((e) => e.id === expense.id);
  if (existingIdx !== -1) {
    sharedState.expenses[existingIdx] = { ...sharedState.expenses[existingIdx], ...expense };
  } else {
    sharedState.expenses = [expense, ...sharedState.expenses];
  }
  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();
  syncToPrismaDb({ expenses: sharedState.expenses }).catch(() => {});
}

export function deleteExpenseFromState(expenseId: string) {
  if (!expenseId) return;
  sharedState.expenses = sharedState.expenses.filter((e) => e.id !== expenseId);
  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();
  prisma.paymentExpense.delete({ where: { id: expenseId } }).catch(() => {});
}

// ─── GET /api/sync ────────────────────────────────────────────────────────────
syncRouter.get('/', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: sharedState,
  });
});

// ─── POST /api/sync ───────────────────────────────────────────────────────────
syncRouter.post('/', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const updated = updateSharedState(payload);

    try {
      if (io) {
        io.emit('state:synced', updated);
      }
    } catch (e) {
      console.warn('Socket broadcast warning:', e);
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('Error in /api/sync:', err);
    res.status(500).json({ error: 'Failed to sync state' });
  }
});
