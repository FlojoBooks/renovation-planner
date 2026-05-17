import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// In productie serveert Express de frontend statisch — geen aparte nginx nodig.
// CORS is alleen nodig in development (frontend op andere poort).
const isProd = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};

const io = new Server(httpServer, {
  cors: isProd ? {} : corsOptions,
});

if (!isProd) {
  app.use(cors({ origin: corsOptions.origin }));
}

app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/project', projectRouter);
app.use('/api/subprojects', subprojectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/persons', personRouter);
app.use('/api/materials', materialRouter);
app.use('/api/comments', commentRouter);
app.use('/api/budget', budgetRouter);

// ─── Frontend static serving (productie) ─────────────────────────────────────
// De Vite build output staat in /app/public/dist (gekopieerd door Dockerfile)
const distPath = path.join(__dirname, '..', 'public');
app.use(express.static(distPath, {
  maxAge: '1y',           // statische assets lang cachen (Vite fingerprints ze)
  immutable: true,
  index: false,           // index.html afhandelen via de SPA-fallback hieronder
}));

// SPA fallback — alle niet-API routes → index.html
app.get('*', (req, res) => {
  // Laat /api/* door als 404 i.p.v. SPA te sturen
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  registerSocketHandlers(io, socket);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

export { io };
