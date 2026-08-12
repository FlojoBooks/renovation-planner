import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRenovationStore } from '../store/useRenovationStore';

const isBrowser = typeof window !== 'undefined';
const isDev = isBrowser && window.location.hostname === 'localhost' && window.location.port === '3000';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev ? 'http://localhost:3001' : '');

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socketInstance;
}

// Granular emit helpers for instant real-time sync across connected clients
export function emitExpenseCreated(expense: any) {
  try {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('expense:create', expense);
    }
  } catch (e) {
    console.warn('Failed to emit expense:create', e);
  }
}

export function emitExpenseUpdated(id: string, updates: any) {
  try {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('expense:update', { id, updates });
    }
  } catch (e) {
    console.warn('Failed to emit expense:update', e);
  }
}

export function emitExpenseDeleted(id: string) {
  try {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('expense:delete', { id });
    }
  } catch (e) {
    console.warn('Failed to emit expense:delete', e);
  }
}

let syncTimeout: any = null;

export function pushStateToServer(state: any) {
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const payload = {
        project: state.project,
        subprojects: state.subprojects,
        tasks: state.tasks,
        persons: state.persons,
        materials: state.materials,
        comments: state.comments,
        budgetLines: state.budgetLines,
        users: state.users,
        expenses: state.expenses,
        availableUpgrades: state.availableUpgrades,
        projectUpgrades: state.projectUpgrades,
      };

      // 1. REST push
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn('REST sync push failed:', err);
      });

      // 2. Socket push
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('state:update', payload);
      }
    } catch (e) {
      console.warn('Sync push error:', e);
    }
  }, 150);
}

export async function fetchServerState() {
  try {
    const res = await fetch('/api/sync');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn('fetchServerState error:', e);
  }
  return null;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useRenovationStore();

  useEffect(() => {
    // 1. Initial REST Sync to instantly pull server data (for new users, colleagues or on refresh)
    async function initSync() {
      try {
        const serverData = await fetchServerState();
        if (serverData) {
          const hasServerData =
            (serverData.tasks && serverData.tasks.length > 0) ||
            (serverData.subprojects && serverData.subprojects.length > 0) ||
            (serverData.users && serverData.users.length > 0) ||
            (serverData.expenses && serverData.expenses.length > 0);

          if (hasServerData) {
            store.applyRemoteState(serverData);
          } else {
            // Server is empty, if local has data, push it to server
            const localTasks = store.tasks;
            const localSubprojects = store.subprojects;
            const localExpenses = store.expenses;
            if (localTasks.length > 0 || localSubprojects.length > 0 || localExpenses.length > 0 || store.users.length > 0) {
              pushStateToServer(store);
            }
          }
        }
      } catch (err) {
        console.warn('Initial sync error:', err);
      }
    }

    initSync();

    const socket = getSocket();
    socketRef.current = socket;

    // 2. Full shared state synchronization event
    socket.on('state:synced', (remoteState: any) => {
      if (remoteState) {
        store.applyRemoteState(remoteState);
      }
    });

    socket.on('connect', () => {
      socket.emit('state:request');
    });

    // ── Incoming granular real-time events from other clients ──────

    // Expenses (Wie Betaalt Wat & Kassabonnen)
    socket.on('expense:created', (expense: any) => {
      if (expense && expense.id) {
        const existing = store.expenses.find((e) => e.id === expense.id);
        if (!existing) {
          useRenovationStore.setState((s) => ({
            expenses: [expense, ...s.expenses.filter((e) => e.id !== expense.id)],
          }));
        }
      }
    });

    socket.on('expense:updated', ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      store.updateExpense(id, updates);
    });

    socket.on('expense:deleted', ({ id }: { id: string }) => {
      useRenovationStore.setState((s) => ({
        expenses: s.expenses.filter((e) => e.id !== id),
      }));
    });

    // Tasks
    socket.on('task:updated', ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      store.updateTask(id, updates as Parameters<typeof store.updateTask>[1]);
    });

    socket.on('task:completed', ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const current = store.getTaskById(id);
      if (current && current.isCompleted !== isCompleted) {
        store.toggleTaskComplete(id);
      }
    });

    socket.on('task:datesUpdated', ({ id, startDate, endDate }: { id: string; startDate: string; endDate: string }) => {
      store.updateTaskDates(id, startDate, endDate);
    });

    socket.on('task:created', (task: Parameters<typeof store.addTask>[0]) => {
      store.addTask(task);
    });

    socket.on('task:deleted', ({ id }: { id: string }) => {
      store.deleteTask(id);
    });

    // Comments
    socket.on('comment:created', (comment: Parameters<typeof store.addComment>[0]) => {
      store.addComment(comment);
    });

    socket.on('comment:deleted', ({ id }: { id: string }) => {
      store.deleteComment(id);
    });

    // Persons
    socket.on('person:created', (person: Parameters<typeof store.addPerson>[0]) => {
      store.addPerson(person);
    });

    socket.on('person:updated', ({ id, updates }: { id: string; updates: Parameters<typeof store.updatePerson>[1] }) => {
      store.updatePerson(id, updates);
    });

    socket.on('person:deleted', ({ id }: { id: string }) => {
      store.deletePerson(id);
    });

    // Subprojects
    socket.on('subproject:created', (sub: Parameters<typeof store.addSubproject>[0]) => {
      store.addSubproject(sub);
    });

    socket.on('subproject:updated', ({ id, updates }: { id: string; updates: Parameters<typeof store.updateSubproject>[1] }) => {
      store.updateSubproject(id, updates);
    });

    socket.on('subproject:deleted', ({ id }: { id: string }) => {
      store.deleteSubproject(id);
    });

    // Materials
    socket.on('material:created', (mat: Parameters<typeof store.addMaterial>[0]) => {
      store.addMaterial(mat);
    });

    socket.on('material:updated', ({ id, updates }: { id: string; updates: Parameters<typeof store.updateMaterial>[1] }) => {
      store.updateMaterial(id, updates);
    });

    socket.on('material:deleted', ({ id }: { id: string }) => {
      store.deleteMaterial(id);
    });

    // Budget Lines
    socket.on('budget:created', (line: Parameters<typeof store.addBudgetLine>[0]) => {
      store.addBudgetLine(line);
    });

    socket.on('budget:updated', ({ id, updates }: { id: string; updates: Parameters<typeof store.updateBudgetLine>[1] }) => {
      store.updateBudgetLine(id, updates);
    });

    socket.on('budget:deleted', ({ id }: { id: string }) => {
      store.deleteBudgetLine(id);
    });

    return () => {
      socket.off('state:synced');
      socket.off('expense:created');
      socket.off('expense:updated');
      socket.off('expense:deleted');
      socket.off('task:updated');
      socket.off('task:completed');
      socket.off('task:datesUpdated');
      socket.off('task:created');
      socket.off('task:deleted');
      socket.off('comment:created');
      socket.off('comment:deleted');
      socket.off('person:created');
      socket.off('person:updated');
      socket.off('person:deleted');
      socket.off('subproject:created');
      socket.off('subproject:updated');
      socket.off('subproject:deleted');
      socket.off('material:created');
      socket.off('material:updated');
      socket.off('material:deleted');
      socket.off('budget:created');
      socket.off('budget:updated');
      socket.off('budget:deleted');
    };
  }, []);

  return socketRef.current;
}
