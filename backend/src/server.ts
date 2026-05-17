import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { projectRouter } from './routes/project';
import { subprojectRouter } from './routes/subprojects';
import { taskRouter } from './routes/tasks';
import { personRouter } from './routes/persons';
import { materialRouter } from './routes/materials';
import { commentRouter } from './routes/comments';
import { budgetRouter } from './routes/budget';
import { registerSocketHandlers } from './socket/handlers';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/project', projectRouter);
app.use('/api/subprojects', subprojectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/persons', personRouter);
app.use('/api/materials', materialRouter);
app.use('/api/comments', commentRouter);
app.use('/api/budget', budgetRouter);

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  registerSocketHandlers(io, socket);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { io };
