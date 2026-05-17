import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const projectRouter = Router();

// ─── GET /api/project ─────────────────────────────────────────────────────────
// Returns the first (and only) project, or 404
projectRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      include: {
        subprojects: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!project) {
      res.status(404).json({ error: 'No project found' });
      return;
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ─── GET /api/project/:id ─────────────────────────────────────────────────────
projectRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        subprojects: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ─── POST /api/project ────────────────────────────────────────────────────────
projectRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      address,
      startDate,
      endDate,
      totalBudget,
      currency,
    } = req.body as {
      name: string;
      description?: string;
      address?: string;
      startDate: string;
      endDate: string;
      totalBudget?: number;
      currency?: string;
    };

    if (!name || !startDate || !endDate) {
      res.status(400).json({ error: 'name, startDate, and endDate are required' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        address,
        startDate,
        endDate,
        totalBudget: totalBudget ?? 0,
        currency: currency ?? 'EUR',
      },
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ─── PATCH /api/project/:id ───────────────────────────────────────────────────
projectRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      address,
      startDate,
      endDate,
      totalBudget,
      currency,
    } = req.body as Partial<{
      name: string;
      description: string;
      address: string;
      startDate: string;
      endDate: string;
      totalBudget: number;
      currency: string;
    }>;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(totalBudget !== undefined && { totalBudget }),
        ...(currency !== undefined && { currency }),
      },
    });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ─── DELETE /api/project/:id ──────────────────────────────────────────────────
projectRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});
