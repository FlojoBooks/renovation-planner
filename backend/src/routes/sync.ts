import { Router, Request, Response } from 'express';
import { io } from '../server';
import fs from 'fs';
import path from 'path';

export const syncRouter = Router();

// File path for disk backup of shared state
const DATA_FILE = path.join(__dirname, '..', '..', 'shared-state.json');

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
  project: null,
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
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        subprojects: Array.isArray(parsed.subprojects) ? parsed.subprojects : [],
      };
      console.log(`[Sync] Loaded shared state from disk (${sharedState.expenses.length} expenses, ${sharedState.tasks.length} tasks)`);
    }
  }
} catch (e) {
  console.warn('[Sync] Failed to load shared-state.json:', e);
}

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
 * If an item exists in both, keep the latest by `updatedAt` or incoming.
 * If an item only exists in one array, keep it.
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
  // 1. Add existing
  for (const item of existingList) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  // 2. Merge or add incoming
  for (const incoming of incomingList) {
    if (!incoming || !incoming.id) continue;
    const current = map.get(incoming.id);
    if (!current) {
      map.set(incoming.id, incoming);
    } else {
      // If both have updatedAt, take newer; otherwise overwrite with incoming
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
    sharedState.subprojects = mergeEntitiesById(sharedState.subprojects, updates.subprojects);
  }
  if (Array.isArray(updates.tasks)) {
    sharedState.tasks = mergeEntitiesById(sharedState.tasks, updates.tasks);
  }
  if (Array.isArray(updates.persons)) {
    sharedState.persons = mergeEntitiesById(sharedState.persons, updates.persons);
  }
  if (Array.isArray(updates.materials)) {
    sharedState.materials = mergeEntitiesById(sharedState.materials, updates.materials);
  }
  if (Array.isArray(updates.comments)) {
    sharedState.comments = mergeEntitiesById(sharedState.comments, updates.comments);
  }
  if (Array.isArray(updates.budgetLines)) {
    sharedState.budgetLines = mergeEntitiesById(sharedState.budgetLines, updates.budgetLines);
  }
  if (Array.isArray(updates.users)) {
    sharedState.users = mergeEntitiesById(sharedState.users, updates.users);
  }
  if (Array.isArray(updates.expenses)) {
    sharedState.expenses = mergeEntitiesById(sharedState.expenses, updates.expenses);
  }
  if (Array.isArray(updates.availableUpgrades)) {
    sharedState.availableUpgrades = mergeEntitiesById(sharedState.availableUpgrades || [], updates.availableUpgrades);
  }
  if (Array.isArray(updates.projectUpgrades)) {
    sharedState.projectUpgrades = mergeEntitiesById(sharedState.projectUpgrades || [], updates.projectUpgrades);
  }

  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();

  return sharedState;
}

// Granular helpers for single entity updates
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
}

export function deleteExpenseFromState(expenseId: string) {
  if (!expenseId) return;
  sharedState.expenses = sharedState.expenses.filter((e) => e.id !== expenseId);
  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();
}

// ─── GET /api/sync ────────────────────────────────────────────────────────────
syncRouter.get('/', (_req: Request, res: Response) => {
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

    // Broadcast updated state to all connected clients via Socket.io
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
