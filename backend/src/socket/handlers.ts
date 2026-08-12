import { Server, Socket } from 'socket.io';
import {
  getSharedState,
  updateSharedState,
  addOrUpdateExpenseInState,
  deleteExpenseFromState,
  mergeEntitiesById,
} from '../routes/sync';

export function registerSocketHandlers(io: Server, socket: Socket): void {
  // ─── Shared full state sync events ────────────────────────────────────────

  // When a client requests current shared state
  socket.on('state:request', () => {
    socket.emit('state:synced', getSharedState());
  });

  // When a client updates state
  socket.on('state:update', (incomingState: Record<string, unknown>) => {
    try {
      const updated = updateSharedState(incomingState);
      // Broadcast new state to all clients
      io.emit('state:synced', updated);
    } catch (e) {
      console.warn('Failed to update shared state from socket:', e);
    }
  });

  // ─── Expense events (Wie Betaalt Wat & Kassabonnen) ───────────────────────

  socket.on('expense:create', (expense: Record<string, unknown>) => {
    try {
      addOrUpdateExpenseInState(expense);
      socket.broadcast.emit('expense:created', expense);
    } catch (e) {
      console.warn('Error broadcasting expense:create', e);
    }
  });

  socket.on('expense:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
      const existing = getSharedState().expenses.find((e: any) => e.id === data.id);
      if (existing) {
        addOrUpdateExpenseInState({ ...existing, ...data.updates, updatedAt: new Date().toISOString() });
      }
      socket.broadcast.emit('expense:updated', data);
    } catch (e) {
      console.warn('Error broadcasting expense:update', e);
    }
  });

  socket.on('expense:delete', (data: { id: string }) => {
    try {
      deleteExpenseFromState(data.id);
      socket.broadcast.emit('expense:deleted', data);
    } catch (e) {
      console.warn('Error broadcasting expense:delete', e);
    }
  });

  // ─── Task events ──────────────────────────────────────────────────────────

  socket.on('task:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
      const state = getSharedState();
      const taskIdx = state.tasks.findIndex((t: any) => t.id === data.id);
      if (taskIdx !== -1) {
        state.tasks[taskIdx] = { ...state.tasks[taskIdx], ...data.updates, updatedAt: new Date().toISOString() };
        updateSharedState({ tasks: state.tasks });
      }
      socket.broadcast.emit('task:updated', data);
    } catch {
      socket.emit('error', { message: 'Failed to broadcast task update' });
    }
  });

  socket.on('task:complete', (data: { id: string; isCompleted: boolean }) => {
    socket.broadcast.emit('task:completed', data);
  });

  socket.on('task:dates', (data: { id: string; startDate: string; endDate: string }) => {
    socket.broadcast.emit('task:datesUpdated', data);
  });

  socket.on('task:create', (task: Record<string, unknown>) => {
    try {
      const state = getSharedState();
      state.tasks = mergeEntitiesById(state.tasks, [task]);
      updateSharedState({ tasks: state.tasks });
      socket.broadcast.emit('task:created', task);
    } catch (e) {
      console.warn('Error in task:create', e);
    }
  });

  socket.on('task:delete', (data: { id: string }) => {
    try {
      const state = getSharedState();
      state.tasks = state.tasks.filter((t: any) => t.id !== data.id);
      updateSharedState({ tasks: state.tasks });
      socket.broadcast.emit('task:deleted', data);
    } catch (e) {
      console.warn('Error in task:delete', e);
    }
  });

  // ─── Comment events ───────────────────────────────────────────────────────

  socket.on('comment:create', (comment: Record<string, unknown>) => {
    try {
      const state = getSharedState();
      state.comments = mergeEntitiesById(state.comments, [comment]);
      updateSharedState({ comments: state.comments });
      socket.broadcast.emit('comment:created', comment);
    } catch (e) {
      console.warn('Error in comment:create', e);
    }
  });

  socket.on('comment:delete', (data: { id: string; taskId: string }) => {
    try {
      const state = getSharedState();
      state.comments = state.comments.filter((c: any) => c.id !== data.id);
      updateSharedState({ comments: state.comments });
      socket.broadcast.emit('comment:deleted', data);
    } catch (e) {
      console.warn('Error in comment:delete', e);
    }
  });

  // ─── Person events ────────────────────────────────────────────────────────

  socket.on('person:create', (person: Record<string, unknown>) => {
    try {
      const state = getSharedState();
      state.persons = mergeEntitiesById(state.persons, [person]);
      updateSharedState({ persons: state.persons });
      socket.broadcast.emit('person:created', person);
    } catch (e) {
      console.warn('Error in person:create', e);
    }
  });

  socket.on('person:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
      const state = getSharedState();
      const idx = state.persons.findIndex((p: any) => p.id === data.id);
      if (idx !== -1) {
        state.persons[idx] = { ...state.persons[idx], ...data.updates };
        updateSharedState({ persons: state.persons });
      }
      socket.broadcast.emit('person:updated', data);
    } catch (e) {
      console.warn('Error in person:update', e);
    }
  });

  socket.on('person:delete', (data: { id: string }) => {
    try {
      const state = getSharedState();
      state.persons = state.persons.filter((p: any) => p.id !== data.id);
      updateSharedState({ persons: state.persons });
      socket.broadcast.emit('person:deleted', data);
    } catch (e) {
      console.warn('Error in person:delete', e);
    }
  });

  // ─── Subproject events ────────────────────────────────────────────────────

  socket.on('subproject:create', (data: Record<string, unknown>) => {
    try {
      const state = getSharedState();
      state.subprojects = mergeEntitiesById(state.subprojects, [data]);
      updateSharedState({ subprojects: state.subprojects });
      socket.broadcast.emit('subproject:created', data);
    } catch (e) {
      console.warn('Error in subproject:create', e);
    }
  });

  socket.on('subproject:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
      const state = getSharedState();
      const idx = state.subprojects.findIndex((s: any) => s.id === data.id);
      if (idx !== -1) {
        state.subprojects[idx] = { ...state.subprojects[idx], ...data.updates, updatedAt: new Date().toISOString() };
        updateSharedState({ subprojects: state.subprojects });
      }
      socket.broadcast.emit('subproject:updated', data);
    } catch (e) {
      console.warn('Error in subproject:update', e);
    }
  });

  socket.on('subproject:delete', (data: { id: string }) => {
    try {
      const state = getSharedState();
      state.subprojects = state.subprojects.filter((s: any) => s.id !== data.id);
      updateSharedState({ subprojects: state.subprojects });
      socket.broadcast.emit('subproject:deleted', data);
    } catch (e) {
      console.warn('Error in subproject:delete', e);
    }
  });

  // ─── Material events ──────────────────────────────────────────────────────

  socket.on('material:create', (data: Record<string, unknown>) => {
    try {
      const state = getSharedState();
      state.materials = mergeEntitiesById(state.materials, [data]);
      updateSharedState({ materials: state.materials });
      socket.broadcast.emit('material:created', data);
    } catch (e) {
      console.warn('Error in material:create', e);
    }
  });

  socket.on('material:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
      const state = getSharedState();
      const idx = state.materials.findIndex((m: any) => m.id === data.id);
      if (idx !== -1) {
        state.materials[idx] = { ...state.materials[idx], ...data.updates, updatedAt: new Date().toISOString() };
        updateSharedState({ materials: state.materials });
      }
      socket.broadcast.emit('material:updated', data);
    } catch (e) {
      console.warn('Error in material:update', e);
    }
  });

  socket.on('material:delete', (data: { id: string; taskId: string }) => {
    try {
      const state = getSharedState();
      state.materials = state.materials.filter((m: any) => m.id !== data.id);
      updateSharedState({ materials: state.materials });
      socket.broadcast.emit('material:deleted', data);
    } catch (e) {
      console.warn('Error in material:delete', e);
    }
  });

  // ─── Budget events ────────────────────────────────────────────────────────

  socket.on('budget:create', (data: Record<string, unknown>) => {
    try {
      const state = getSharedState();
      state.budgetLines = mergeEntitiesById(state.budgetLines, [data]);
      updateSharedState({ budgetLines: state.budgetLines });
      socket.broadcast.emit('budget:created', data);
    } catch (e) {
      console.warn('Error in budget:create', e);
    }
  });

  socket.on('budget:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
      const state = getSharedState();
      const idx = state.budgetLines.findIndex((b: any) => b.id === data.id);
      if (idx !== -1) {
        state.budgetLines[idx] = { ...state.budgetLines[idx], ...data.updates, updatedAt: new Date().toISOString() };
        updateSharedState({ budgetLines: state.budgetLines });
      }
      socket.broadcast.emit('budget:updated', data);
    } catch (e) {
      console.warn('Error in budget:update', e);
    }
  });

  socket.on('budget:delete', (data: { id: string }) => {
    try {
      const state = getSharedState();
      state.budgetLines = state.budgetLines.filter((b: any) => b.id !== data.id);
      updateSharedState({ budgetLines: state.budgetLines });
      socket.broadcast.emit('budget:deleted', data);
    } catch (e) {
      console.warn('Error in budget:delete', e);
    }
  });

  // ─── Ping / pong ─────────────────────────────────────────────────────────
  socket.on('ping', () => socket.emit('pong'));
}
