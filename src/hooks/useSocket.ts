import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRenovationStore } from '../store/useRenovationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useRenovationStore();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // ── Incoming real-time events from other clients ──────

    // Tasks
    socket.on('task:updated', ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      store.updateTask(id, updates as Parameters<typeof store.updateTask>[1]);
    });

    socket.on('task:completed', ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      // Only toggle if state is different to avoid infinite loop
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

    return () => {
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
    };
  }, []);

  return socketRef.current;
}
