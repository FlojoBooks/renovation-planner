import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const materialRouter = Router();

// ─── GET /api/materials?taskId=xxx ────────────────────────────────────────────
materialRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query as { taskId?: string };

    const materials = await prisma.material.findMany({
      where: taskId ? { taskId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// ─── GET /api/materials/:id ───────────────────────────────────────────────────
materialRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
    });
    if (!material) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }
    res.json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// ─── POST /api/materials ──────────────────────────────────────────────────────
materialRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      taskId,
      name,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      status,
      supplier,
      supplierUrl,
      articleNumber,
      notes,
      orderedAt,
      deliveredAt,
    } = req.body as {
      taskId: string;
      name: string;
      quantity?: number;
      unit?: string;
      unitPrice?: number;
      totalPrice?: number;
      status?: string;
      supplier?: string;
      supplierUrl?: string;
      articleNumber?: string;
      notes?: string;
      orderedAt?: string;
      deliveredAt?: string;
    };

    if (!taskId || !name) {
      res.status(400).json({ error: 'taskId and name are required' });
      return;
    }

    const qty = quantity ?? 1;
    const price = unitPrice ?? 0;
    const computedTotal = totalPrice ?? qty * price;

    const material = await prisma.material.create({
      data: {
        taskId,
        name,
        quantity: qty,
        unit: unit ?? 'stuks',
        unitPrice: price,
        totalPrice: computedTotal,
        status: status ?? 'needed',
        supplier,
        supplierUrl,
        articleNumber,
        notes,
        orderedAt,
        deliveredAt,
      },
    });
    res.status(201).json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// ─── PATCH /api/materials/:id ─────────────────────────────────────────────────
materialRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const {
      name,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      status,
      supplier,
      supplierUrl,
      articleNumber,
      notes,
      orderedAt,
      deliveredAt,
    } = req.body as Partial<{
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      status: string;
      supplier: string;
      supplierUrl: string;
      articleNumber: string;
      notes: string;
      orderedAt: string;
      deliveredAt: string;
    }>;

    // Recalculate totalPrice if quantity or unitPrice changed and totalPrice not explicitly sent
    const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    const newQty = quantity ?? existing.quantity;
    const newUnitPrice = unitPrice ?? existing.unitPrice;
    const newTotalPrice = totalPrice ?? newQty * newUnitPrice;

    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(unitPrice !== undefined && { unitPrice }),
        totalPrice: newTotalPrice,
        ...(status !== undefined && { status }),
        ...(supplier !== undefined && { supplier }),
        ...(supplierUrl !== undefined && { supplierUrl }),
        ...(articleNumber !== undefined && { articleNumber }),
        ...(notes !== undefined && { notes }),
        ...(orderedAt !== undefined && { orderedAt }),
        ...(deliveredAt !== undefined && { deliveredAt }),
      },
    });
    res.json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// ─── DELETE /api/materials/:id ────────────────────────────────────────────────
materialRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});
