import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const budgetRouter = Router();

// ─── GET /api/budget ──────────────────────────────────────────────────────────
// Supports ?projectId=xxx and/or ?subprojectId=xxx as filters
budgetRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, subprojectId } = req.query as {
      projectId?: string;
      subprojectId?: string;
    };

    const budgetLines = await prisma.budgetLine.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(subprojectId && { subprojectId }),
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(budgetLines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budget lines' });
  }
});

// ─── GET /api/budget/:id ──────────────────────────────────────────────────────
budgetRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const line = await prisma.budgetLine.findUnique({
      where: { id: req.params.id },
    });
    if (!line) {
      res.status(404).json({ error: 'Budget line not found' });
      return;
    }
    res.json(line);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budget line' });
  }
});

// ─── POST /api/budget ─────────────────────────────────────────────────────────
budgetRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      subprojectId,
      projectId,
      taskId,
      description,
      category,
      estimated,
      actual,
      isPaid,
      paidAt,
      invoiceReference,
      supplier,
      notes,
    } = req.body as {
      subprojectId: string;
      projectId: string;
      taskId?: string;
      description: string;
      category?: string;
      estimated?: number;
      actual?: number;
      isPaid?: boolean;
      paidAt?: string;
      invoiceReference?: string;
      supplier?: string;
      notes?: string;
    };

    if (!subprojectId || !projectId || !description) {
      res.status(400).json({ error: 'subprojectId, projectId, and description are required' });
      return;
    }

    const line = await prisma.budgetLine.create({
      data: {
        subprojectId,
        projectId,
        taskId,
        description,
        category: category ?? 'other',
        estimated: estimated ?? 0,
        actual: actual ?? 0,
        isPaid: isPaid ?? false,
        paidAt,
        invoiceReference,
        supplier,
        notes,
      },
    });
    res.status(201).json(line);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create budget line' });
  }
});

// ─── PATCH /api/budget/:id ────────────────────────────────────────────────────
budgetRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const {
      description,
      category,
      estimated,
      actual,
      isPaid,
      paidAt,
      invoiceReference,
      supplier,
      notes,
      taskId,
    } = req.body as Partial<{
      description: string;
      category: string;
      estimated: number;
      actual: number;
      isPaid: boolean;
      paidAt: string;
      invoiceReference: string;
      supplier: string;
      notes: string;
      taskId: string;
    }>;

    const line = await prisma.budgetLine.update({
      where: { id: req.params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(estimated !== undefined && { estimated }),
        ...(actual !== undefined && { actual }),
        ...(isPaid !== undefined && { isPaid }),
        ...(paidAt !== undefined && { paidAt }),
        ...(invoiceReference !== undefined && { invoiceReference }),
        ...(supplier !== undefined && { supplier }),
        ...(notes !== undefined && { notes }),
        ...(taskId !== undefined && { taskId }),
      },
    });
    res.json(line);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update budget line' });
  }
});

// ─── DELETE /api/budget/:id ───────────────────────────────────────────────────
budgetRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.budgetLine.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete budget line' });
  }
});
