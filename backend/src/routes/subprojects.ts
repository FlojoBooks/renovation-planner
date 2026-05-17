import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const subprojectRouter = Router();

// ─── GET /api/subprojects?projectId=xxx ───────────────────────────────────────
subprojectRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query as { projectId?: string };

    const subprojects = await prisma.subproject.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignees: { include: { person: true } },
            dependsOn: true,
            dependedOnBy: true,
          },
        },
      },
    });

    // Transform to match frontend shape
    const transformed = subprojects.map((sp) => ({
      ...sp,
      tasks: sp.tasks.map(transformTask),
    }));

    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subprojects' });
  }
});

// ─── GET /api/subprojects/:id ─────────────────────────────────────────────────
subprojectRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const subproject = await prisma.subproject.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignees: { include: { person: true } },
            dependsOn: true,
            dependedOnBy: true,
          },
        },
      },
    });

    if (!subproject) {
      res.status(404).json({ error: 'Subproject not found' });
      return;
    }

    res.json({
      ...subproject,
      tasks: subproject.tasks.map(transformTask),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subproject' });
  }
});

// ─── POST /api/subprojects ────────────────────────────────────────────────────
subprojectRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      name,
      description,
      color,
      startDate,
      endDate,
      isCollapsed,
      order,
    } = req.body as {
      projectId: string;
      name: string;
      description?: string;
      color?: string;
      startDate: string;
      endDate: string;
      isCollapsed?: boolean;
      order?: number;
    };

    if (!projectId || !name || !startDate || !endDate) {
      res.status(400).json({ error: 'projectId, name, startDate, and endDate are required' });
      return;
    }

    // Auto-assign order if not provided
    let resolvedOrder = order;
    if (resolvedOrder === undefined) {
      const maxOrder = await prisma.subproject.aggregate({
        where: { projectId },
        _max: { order: true },
      });
      resolvedOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const subproject = await prisma.subproject.create({
      data: {
        projectId,
        name,
        description,
        color: color ?? 'blue',
        startDate,
        endDate,
        isCollapsed: isCollapsed ?? false,
        order: resolvedOrder,
      },
    });

    res.status(201).json({ ...subproject, tasks: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subproject' });
  }
});

// ─── PATCH /api/subprojects/:id ───────────────────────────────────────────────
subprojectRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      color,
      startDate,
      endDate,
      isCollapsed,
      order,
    } = req.body as Partial<{
      name: string;
      description: string;
      color: string;
      startDate: string;
      endDate: string;
      isCollapsed: boolean;
      order: number;
    }>;

    const subproject = await prisma.subproject.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(isCollapsed !== undefined && { isCollapsed }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(subproject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subproject' });
  }
});

// ─── DELETE /api/subprojects/:id ──────────────────────────────────────────────
subprojectRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.subproject.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subproject' });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function transformTask(task: {
  assignees: { personId: string; person: { id: string } }[];
  dependsOn: { prerequisiteTaskId: string }[];
  dependedOnBy: { dependentTaskId: string }[];
  [key: string]: unknown;
}) {
  const { assignees, dependsOn, dependedOnBy, ...rest } = task;
  return {
    ...rest,
    assigneeIds: assignees.map((a) => a.personId),
    dependencyIds: dependsOn.map((d) => d.prerequisiteTaskId),
  };
}
