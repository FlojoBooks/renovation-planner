import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const taskRouter = Router();

// ─── GET /api/tasks?subprojectId=xxx ──────────────────────────────────────────
taskRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { subprojectId } = req.query as { subprojectId?: string };

    const tasks = await prisma.task.findMany({
      where: subprojectId ? { subprojectId } : undefined,
      orderBy: { order: 'asc' },
      include: {
        assignees: { include: { person: true } },
        dependsOn: true,
        dependedOnBy: true,
      },
    });

    res.json(tasks.map(transformTaskList));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
taskRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignees: { include: { person: true } },
        dependsOn: true,
        dependedOnBy: true,
        materials: { orderBy: { createdAt: 'asc' } },
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(transformTaskFull(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
taskRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      subprojectId,
      title,
      description,
      status,
      priority,
      startDate,
      endDate,
      progress,
      estimatedHours,
      actualHours,
      order,
      tags,
      assigneeIds,
      dependencyIds,
    } = req.body as {
      subprojectId: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      startDate: string;
      endDate: string;
      progress?: number;
      estimatedHours?: number;
      actualHours?: number;
      order?: number;
      tags?: string[];
      assigneeIds?: string[];
      dependencyIds?: string[];
    };

    if (!subprojectId || !title || !startDate || !endDate) {
      res.status(400).json({ error: 'subprojectId, title, startDate, and endDate are required' });
      return;
    }

    // Auto-assign order if not provided
    let resolvedOrder = order;
    if (resolvedOrder === undefined) {
      const maxOrder = await prisma.task.aggregate({
        where: { subprojectId },
        _max: { order: true },
      });
      resolvedOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const task = await prisma.task.create({
      data: {
        subprojectId,
        title,
        description,
        status: status ?? 'todo',
        priority: priority ?? 'medium',
        startDate,
        endDate,
        progress: progress ?? 0,
        estimatedHours,
        actualHours,
        order: resolvedOrder,
        tags: tags ?? [],
        // Create assignees
        assignees: assigneeIds?.length
          ? {
              create: assigneeIds.map((personId) => ({ personId })),
            }
          : undefined,
        // Create dependencies
        dependsOn: dependencyIds?.length
          ? {
              create: dependencyIds.map((prerequisiteTaskId) => ({ prerequisiteTaskId })),
            }
          : undefined,
      },
      include: {
        assignees: { include: { person: true } },
        dependsOn: true,
        dependedOnBy: true,
        materials: true,
        comments: { include: { author: true } },
      },
    });

    res.status(201).json(transformTaskFull(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
taskRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      startDate,
      endDate,
      progress,
      isCompleted,
      estimatedHours,
      actualHours,
      order,
      tags,
      assigneeIds,
      dependencyIds,
    } = req.body as Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      startDate: string;
      endDate: string;
      progress: number;
      isCompleted: boolean;
      estimatedHours: number;
      actualHours: number;
      order: number;
      tags: string[];
      assigneeIds: string[];
      dependencyIds: string[];
    }>;

    const taskId = req.params.id;

    // Verify task exists
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Handle assignees replacement
    if (assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((personId) => ({ taskId, personId })),
          skipDuplicates: true,
        });
      }
    }

    // Handle dependencies replacement
    if (dependencyIds !== undefined) {
      await prisma.taskDependency.deleteMany({ where: { dependentTaskId: taskId } });
      if (dependencyIds.length > 0) {
        await prisma.taskDependency.createMany({
          data: dependencyIds.map((prerequisiteTaskId) => ({
            dependentTaskId: taskId,
            prerequisiteTaskId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(progress !== undefined && { progress }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(actualHours !== undefined && { actualHours }),
        ...(order !== undefined && { order }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        assignees: { include: { person: true } },
        dependsOn: true,
        dependedOnBy: true,
        materials: true,
        comments: { include: { author: true } },
      },
    });

    res.json(transformTaskFull(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
taskRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ─── PATCH /api/tasks/:id/complete ────────────────────────────────────────────
taskRouter.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const newCompleted = !existing.isCompleted;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        isCompleted: newCompleted,
        status: newCompleted ? 'done' : 'in-progress',
        progress: newCompleted ? 100 : existing.progress,
      },
      include: {
        assignees: { include: { person: true } },
        dependsOn: true,
        dependedOnBy: true,
        materials: true,
        comments: { include: { author: true } },
      },
    });

    res.json(transformTaskFull(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle task completion' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TaskListRaw = {
  assignees: { personId: string; person: { id: string } }[];
  dependsOn: { prerequisiteTaskId: string }[];
  dependedOnBy: { dependentTaskId: string }[];
  [key: string]: unknown;
};

type TaskFullRaw = TaskListRaw & {
  materials: unknown[];
  comments: unknown[];
};

function transformTaskList(task: TaskListRaw) {
  const { assignees, dependsOn, dependedOnBy, ...rest } = task;
  return {
    ...rest,
    assigneeIds: assignees.map((a) => a.personId),
    dependencyIds: dependsOn.map((d) => d.prerequisiteTaskId),
  };
}

function transformTaskFull(task: TaskFullRaw) {
  const { assignees, dependsOn, dependedOnBy, ...rest } = task;
  return {
    ...rest,
    assigneeIds: assignees.map((a) => a.personId),
    assignees: assignees.map((a) => a.person),
    dependencyIds: dependsOn.map((d) => d.prerequisiteTaskId),
  };
}
