import { Router, Request, Response } from 'express';
import { io } from '../server';

export const syncRouter = Router();

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
  lastUpdated: new Date().toISOString(),
};

export function getSharedState() {
  return sharedState;
}

export function updateSharedState(updates: Partial<typeof sharedState>) {
  sharedState = {
    ...sharedState,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  return sharedState;
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

    const {
      project,
      subprojects,
      tasks,
      persons,
      materials,
      comments,
      budgetLines,
      users,
      expenses,
    } = payload;

    // Merge incoming data
    if (project !== undefined) sharedState.project = project;
    if (Array.isArray(subprojects)) sharedState.subprojects = subprojects;
    if (Array.isArray(tasks)) sharedState.tasks = tasks;
    if (Array.isArray(persons)) sharedState.persons = persons;
    if (Array.isArray(materials)) sharedState.materials = materials;
    if (Array.isArray(comments)) sharedState.comments = comments;
    if (Array.isArray(budgetLines)) sharedState.budgetLines = budgetLines;
    if (Array.isArray(users)) {
      // Merge users by ID to not overwrite existing users
      const existingUserMap = new Map(sharedState.users.map((u: any) => [u.id, u]));
      for (const u of users) {
        existingUserMap.set(u.id, { ...(existingUserMap.get(u.id) || {}), ...u });
      }
      sharedState.users = Array.from(existingUserMap.values());
    }
    if (Array.isArray(expenses)) sharedState.expenses = expenses;

    sharedState.lastUpdated = new Date().toISOString();

    // Broadcast updated state to all connected clients via Socket.io
    try {
      if (io) {
        io.emit('state:synced', sharedState);
      }
    } catch (e) {
      console.warn('Socket broadcast warning:', e);
    }

    res.json({
      success: true,
      data: sharedState,
    });
  } catch (err) {
    console.error('Error in /api/sync:', err);
    res.status(500).json({ error: 'Failed to sync state' });
  }
});
