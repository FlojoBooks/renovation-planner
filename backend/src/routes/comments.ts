import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const commentRouter = Router();

// ─── GET /api/comments?taskId=xxx ─────────────────────────────────────────────
commentRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query as { taskId?: string };

    const comments = await prisma.comment.findMany({
      where: taskId ? { taskId } : undefined,
      orderBy: { createdAt: 'asc' },
      include: { author: true },
    });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// ─── GET /api/comments/:id ────────────────────────────────────────────────────
commentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: { author: true },
    });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

// ─── POST /api/comments ───────────────────────────────────────────────────────
commentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { taskId, authorId, content } = req.body as {
      taskId: string;
      authorId: string;
      content: string;
    };

    if (!taskId || !authorId || !content) {
      res.status(400).json({ error: 'taskId, authorId, and content are required' });
      return;
    }

    // Look up author name
    const author = await prisma.person.findUnique({ where: { id: authorId } });
    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        authorId,
        authorName: author.name,
        content,
      },
      include: { author: true },
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// ─── PATCH /api/comments/:id ──────────────────────────────────────────────────
commentRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { content } = req.body as { content?: string };

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: {
        content,
        isEdited: true,
      },
      include: { author: true },
    });
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// ─── DELETE /api/comments/:id ─────────────────────────────────────────────────
commentRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});
