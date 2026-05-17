import { Server, Socket } from 'socket.io';

export function registerSocketHandlers(io: Server, socket: Socket): void {
  // ─── Task events ──────────────────────────────────────────────────────────

  socket.on('task:update', (data: { id: string; updates: Record<string, unknown> }) => {
    try {
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

  socket.on('task:create', (data: Record<string, unknown>) => {
    socket.broadcast.emit('task:created', data);
  });

  socket.on('task:delete', (data: { id: string }) => {
    socket.broadcast.emit('task:deleted', data);
  });

  // ─── Comment events ───────────────────────────────────────────────────────

  socket.on('comment:create', (data: Record<string, unknown>) => {
    socket.broadcast.emit('comment:created', data);
  });

  socket.on('comment:delete', (data: { id: string; taskId: string }) => {
    socket.broadcast.emit('comment:deleted', data);
  });

  // ─── Person events ────────────────────────────────────────────────────────

  socket.on('person:create', (data: Record<string, unknown>) => {
    socket.broadcast.emit('person:created', data);
  });

  socket.on('person:update', (data: { id: string; updates: Record<string, unknown> }) => {
    socket.broadcast.emit('person:updated', data);
  });

  socket.on('person:delete', (data: { id: string }) => {
    socket.broadcast.emit('person:deleted', data);
  });

  // ─── Subproject events ────────────────────────────────────────────────────

  socket.on('subproject:create', (data: Record<string, unknown>) => {
    socket.broadcast.emit('subproject:created', data);
  });

  socket.on('subproject:update', (data: { id: string; updates: Record<string, unknown> }) => {
    socket.broadcast.emit('subproject:updated', data);
  });

  socket.on('subproject:delete', (data: { id: string }) => {
    socket.broadcast.emit('subproject:deleted', data);
  });

  // ─── Material events ──────────────────────────────────────────────────────

  socket.on('material:create', (data: Record<string, unknown>) => {
    socket.broadcast.emit('material:created', data);
  });

  socket.on('material:update', (data: { id: string; updates: Record<string, unknown> }) => {
    socket.broadcast.emit('material:updated', data);
  });

  socket.on('material:delete', (data: { id: string; taskId: string }) => {
    socket.broadcast.emit('material:deleted', data);
  });

  // ─── Budget events ────────────────────────────────────────────────────────

  socket.on('budget:create', (data: Record<string, unknown>) => {
    socket.broadcast.emit('budget:created', data);
  });

  socket.on('budget:update', (data: { id: string; updates: Record<string, unknown> }) => {
    socket.broadcast.emit('budget:updated', data);
  });

  socket.on('budget:delete', (data: { id: string }) => {
    socket.broadcast.emit('budget:deleted', data);
  });

  // ─── Ping / pong ─────────────────────────────────────────────────────────
  socket.on('ping', () => socket.emit('pong'));
}
