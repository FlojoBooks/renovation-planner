import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const personRouter = Router();

// ─── GET /api/persons ─────────────────────────────────────────────────────────
personRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const persons = await prisma.person.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(persons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch persons' });
  }
});

// ─── GET /api/persons/:id ─────────────────────────────────────────────────────
personRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id: req.params.id },
    });
    if (!person) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }
    res.json(person);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch person' });
  }
});

// ─── POST /api/persons ────────────────────────────────────────────────────────
personRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, label, color, email, avatarInitials } = req.body as {
      name: string;
      label: string;
      color?: string;
      email?: string;
      avatarInitials: string;
    };

    if (!name || !label || !avatarInitials) {
      res.status(400).json({ error: 'name, label, and avatarInitials are required' });
      return;
    }

    const person = await prisma.person.create({
      data: {
        name,
        label,
        color: color ?? '#0ea5e9',
        email,
        avatarInitials,
      },
    });
    res.status(201).json(person);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

// ─── PATCH /api/persons/:id ───────────────────────────────────────────────────
personRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, label, color, email, avatarInitials } = req.body as Partial<{
      name: string;
      label: string;
      color: string;
      email: string;
      avatarInitials: string;
    }>;

    const person = await prisma.person.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(label !== undefined && { label }),
        ...(color !== undefined && { color }),
        ...(email !== undefined && { email }),
        ...(avatarInitials !== undefined && { avatarInitials }),
      },
    });
    res.json(person);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

// ─── DELETE /api/persons/:id ──────────────────────────────────────────────────
personRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.person.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});
