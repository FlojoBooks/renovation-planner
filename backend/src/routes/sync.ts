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

const MOCK_NAMES = ['Alice Jansen', 'Bob de Vries', 'Carol Smit', 'David Bakker', 'Verbouwing Thuis 2025'];
const MOCK_ID_PREFIXES = ['person-alice', 'person-bob', 'person-carol', 'person-david', 'sub-badkamer', 'sub-isolatie', 'sub-elektra', 'sub-keuken', 'task-sloop', 'task-tegels', 'task-sanitair', 'task-vloer', 'task-spouw', 'task-meterkast', 'task-groepen', 'task-keuken', 'project-verbouwing-2025'];

// Purge any old mock/seed data from PostgreSQL and in-memory state
async function purgeLegacyMockData() {
  try {
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { authorName: { in: MOCK_NAMES } },
          { authorId: { in: ['person-alice', 'person-bob', 'person-carol', 'person-david'] } },
        ],
      },
    });
    await prisma.taskAssignee.deleteMany({
      where: {
        OR: [
          { personId: { in: ['person-alice', 'person-bob', 'person-carol', 'person-david'] } },
        ],
      },
    });
    await prisma.task.deleteMany({
      where: {
        OR: [
          { title: { contains: 'sloop', mode: 'insensitive' } },
          { title: { contains: 'badkamer', mode: 'insensitive' } },
          { title: { contains: 'isolatie', mode: 'insensitive' } },
          { title: { contains: 'meterkast', mode: 'insensitive' } },
          { title: { contains: 'groepen', mode: 'insensitive' } },
          { id: { in: ['task-sloop-badkamer', 'task-tegels-badkamer', 'task-sanitair', 'task-afwerking-badkamer', 'task-vloerisolatie', 'task-spouwmuur', 'task-meterkast', 'task-groepen', 'task-keuken-sloop', 'task-keuken-plaatsen', 'task-keuken-tegels'] } },
        ],
      },
    });
    await prisma.subproject.deleteMany({
      where: {
        OR: [
          { id: { in: ['sub-badkamer', 'sub-isolatie', 'sub-elektra', 'sub-keuken'] } },
          { name: { in: ['Badkamer', 'Begane grond isolatie', 'Elektra', 'Keuken'] } },
          { projectId: 'project-verbouwing-2025' },
        ],
      },
    });
    await prisma.budgetLine.deleteMany({
      where: {
        OR: [
          { projectId: 'project-verbouwing-2025' },
          { id: { in: ['budget-badkamer-materiaal', 'budget-badkamer-sanitair', 'budget-badkamer-arbeid', 'budget-isolatie-materiaal', 'budget-elektra-meterkast', 'budget-keuken-totaal'] } },
        ],
      },
    });
    await prisma.paymentExpense.deleteMany({
      where: {
        OR: [
          { paidByUserName: { in: MOCK_NAMES } },
          { paidByUserId: { in: ['person-alice', 'person-bob', 'person-carol', 'person-david'] } },
        ],
      },
    });
    await prisma.person.deleteMany({
      where: {
        OR: [
          { name: { in: MOCK_NAMES } },
          { id: { in: ['person-alice', 'person-bob', 'person-carol', 'person-david'] } },
        ],
      },
    });
    await prisma.project.deleteMany({
      where: {
        OR: [
          { id: 'project-verbouwing-2025' },
          { name: { contains: 'Verbouwing Thuis', mode: 'insensitive' } },
        ],
      },
    });
    console.log('[Sync] Successfully cleaned legacy mock rows from database');
  } catch (err) {
    // Silently continue if tables not yet populated
  }
}

// Attempt to load from PostgreSQL Prisma DB if connected
async function tryLoadFromPrisma() {
  try {
    await purgeLegacyMockData();

    const project = await prisma.project.findFirst({
      include: {
        subprojects: { orderBy: { order: 'asc' } },
      },
    });

    if (project && project.id !== 'project-verbouwing-2025') {
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
      sharedState.subprojects = project.subprojects || [];
      sharedState.tasks = (tasks || []).map((t) => ({
        ...t,
        assigneeIds: t.assignees.map((a) => a.personId),
        dependencies: t.dependsOn.map((d) => d.prerequisiteTaskId),
      }));
      sharedState.persons = persons || [];
      sharedState.users = users || [];
      sharedState.materials = materials || [];
      sharedState.comments = comments || [];
      sharedState.budgetLines = budgetLines || [];
      sharedState.expenses = expenses || [];

      console.log(`[Sync] Loaded clean state from PostgreSQL (${sharedState.tasks.length} tasks, ${sharedState.subprojects.length} subprojects)`);
      persistSharedStateToDisk();
    }
  } catch (err) {
    // Database not running locally or table empty, proceed with clean in-memory/disk store
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
    const projectId = updates.project?.id || sharedState.project?.id || 'proj-001';
    const projectName = updates.project?.name || sharedState.project?.name || 'Mijn Project';

    // 1. Ensure project exists in PostgreSQL
    await prisma.project.upsert({
      where: { id: projectId },
      update: {
        name: projectName,
        description: updates.project?.description ?? sharedState.project?.description ?? '',
        address: updates.project?.address ?? sharedState.project?.address ?? '',
        startDate: updates.project?.startDate ?? sharedState.project?.startDate ?? new Date().toISOString().split('T')[0],
        endDate: updates.project?.endDate ?? sharedState.project?.endDate ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalBudget: Number(updates.project?.totalBudget ?? sharedState.project?.totalBudget ?? 0),
        currency: updates.project?.currency ?? 'EUR',
      },
      create: {
        id: projectId,
        name: projectName,
        description: updates.project?.description ?? '',
        address: updates.project?.address ?? '',
        startDate: updates.project?.startDate ?? new Date().toISOString().split('T')[0],
        endDate: updates.project?.endDate ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalBudget: Number(updates.project?.totalBudget ?? 0),
        currency: updates.project?.currency ?? 'EUR',
      },
    });

    // 2. Ensure all subprojects exist in PostgreSQL
    if (Array.isArray(updates.subprojects)) {
      for (const sp of updates.subprojects) {
        if (!sp || !sp.id) continue;
        await prisma.subproject.upsert({
          where: { id: sp.id },
          update: {
            name: sp.name || 'Fase',
            description: sp.description || '',
            color: sp.color || 'blue',
            startDate: sp.startDate || new Date().toISOString().split('T')[0],
            endDate: sp.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCollapsed: Boolean(sp.isCollapsed),
            order: Number(sp.order ?? 0),
          },
          create: {
            id: sp.id,
            projectId: projectId,
            name: sp.name || 'Fase',
            description: sp.description || '',
            color: sp.color || 'blue',
            startDate: sp.startDate || new Date().toISOString().split('T')[0],
            endDate: sp.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCollapsed: Boolean(sp.isCollapsed),
            order: Number(sp.order ?? 0),
          },
        });
      }
    }

    // 3. Ensure all tasks exist in PostgreSQL
    if (Array.isArray(updates.tasks)) {
      for (const t of updates.tasks) {
        if (!t || !t.id) continue;
        const subId = t.subprojectId || (updates.subprojects && updates.subprojects[0]?.id) || (sharedState.subprojects[0]?.id) || 'sub-default';

        // Guarantee parent subproject exists before saving task
        await prisma.subproject.upsert({
          where: { id: subId },
          update: {},
          create: {
            id: subId,
            projectId: projectId,
            name: 'Algemeen',
            color: 'blue',
            startDate: t.startDate || new Date().toISOString().split('T')[0],
            endDate: t.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        });

        await prisma.task.upsert({
          where: { id: t.id },
          update: {
            title: t.title || 'Nieuwe taak',
            description: t.description || '',
            status: t.status || 'todo',
            priority: t.priority || 'medium',
            startDate: t.startDate || new Date().toISOString().split('T')[0],
            endDate: t.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: Number(t.progress ?? 0),
            isCompleted: Boolean(t.isCompleted),
            estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
            actualHours: t.actualHours ? Number(t.actualHours) : null,
            order: Number(t.order ?? 0),
            tags: Array.isArray(t.tags) ? t.tags : [],
          },
          create: {
            id: t.id,
            subprojectId: subId,
            title: t.title || 'Nieuwe taak',
            description: t.description || '',
            status: t.status || 'todo',
            priority: t.priority || 'medium',
            startDate: t.startDate || new Date().toISOString().split('T')[0],
            endDate: t.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: Number(t.progress ?? 0),
            isCompleted: Boolean(t.isCompleted),
            estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
            actualHours: t.actualHours ? Number(t.actualHours) : null,
            order: Number(t.order ?? 0),
            tags: Array.isArray(t.tags) ? t.tags : [],
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
            title: e.title || 'Uitgave',
            amount: Number(e.amount || 0),
            category: e.category || 'materials',
            paidByUserId: e.paidByUserId || '',
            paidByUserName: e.paidByUserName || '',
            splitAmongUserIds: Array.isArray(e.splitAmongUserIds) ? e.splitAmongUserIds : [],
            subprojectId: e.subprojectId || null,
            taskId: e.taskId || null,
            date: e.date || new Date().toISOString().split('T')[0],
            receiptImage: e.receiptImage || null,
            receiptThumbnail: e.receiptThumbnail || null,
            notes: e.notes || null,
          },
          create: {
            id: e.id,
            title: e.title || 'Uitgave',
            amount: Number(e.amount || 0),
            category: e.category || 'materials',
            paidByUserId: e.paidByUserId || '',
            paidByUserName: e.paidByUserName || '',
            splitAmongUserIds: Array.isArray(e.splitAmongUserIds) ? e.splitAmongUserIds : [],
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
    console.error('[Sync] Prisma sync error:', err);
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

// ─── POST /api/sync/clear ─────────────────────────────────────────────────────
syncRouter.post('/clear', async (_req: Request, res: Response) => {
  try {
    sharedState = {
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
    persistSharedStateToDisk();

    try {
      await prisma.comment.deleteMany();
      await prisma.material.deleteMany();
      await prisma.taskDependency.deleteMany();
      await prisma.taskAssignee.deleteMany();
      await prisma.task.deleteMany();
      await prisma.budgetLine.deleteMany();
      await prisma.subproject.deleteMany();
      await prisma.paymentExpense.deleteMany();
      await prisma.projectUpgrade.deleteMany();
      await prisma.person.deleteMany();
      await prisma.project.deleteMany();
    } catch (dbErr) {
      console.warn('Database clear warning:', dbErr);
    }

    try {
      if (io) {
        io.emit('state:synced', sharedState);
      }
    } catch (e) {}

    res.json({
      success: true,
      data: sharedState,
      message: 'Alle projectdata succesvol gewist',
    });
  } catch (err) {
    console.error('Error in /api/sync/clear:', err);
    res.status(500).json({ error: 'Failed to clear state' });
  }
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
