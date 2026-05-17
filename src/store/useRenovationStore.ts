import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  RenovationStore,
  Project,
  Subproject,
  Task,
  Person,
  Material,
  Comment,
  BudgetLine,
  TaskStatus,
  TaskPriority,
  ActiveView,
  GanttViewMode,
  BudgetSummary,
  BudgetCategory,
} from '../types';
import { seedData } from '../data/seed';
import { generateId, formatISODate } from '../utils';

const now = () => new Date().toISOString();

export const useRenovationStore = create<RenovationStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────
      project: seedData.project,
      subprojects: seedData.subprojects,
      tasks: seedData.tasks,
      persons: seedData.persons,
      materials: seedData.materials,
      comments: seedData.comments,
      budgetLines: seedData.budgetLines,

      // ── UI State ─────────────────────────────────────────
      activeView: 'gantt' as ActiveView,
      activeSubprojectId: null,
      selectedTaskId: null,
      ganttViewMode: 'Week' as GanttViewMode,
      isTaskModalOpen: false,
      isPersonsModalOpen: false,
      isSidebarCollapsed: false,
      isDarkMode: false,
      searchQuery: '',
      filterAssigneeIds: [],
      filterStatus: [],
      filterPriority: [],

      // ── Project Actions ───────────────────────────────────
      updateProject: (updates: Partial<Project>) =>
        set((s) => ({ project: { ...s.project, ...updates, updatedAt: now() } })),

      // ── Subproject Actions ────────────────────────────────
      addSubproject: (sub) =>
        set((s) => ({
          subprojects: [
            ...s.subprojects,
            {
              ...sub,
              id: generateId('sub'),
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        })),

      updateSubproject: (id, updates) =>
        set((s) => ({
          subprojects: s.subprojects.map((sp) =>
            sp.id === id ? { ...sp, ...updates, updatedAt: now() } : sp
          ),
        })),

      deleteSubproject: (id) =>
        set((s) => ({
          subprojects: s.subprojects.filter((sp) => sp.id !== id),
          tasks: s.tasks.filter((t) => t.subprojectId !== id),
        })),

      toggleSubprojectCollapsed: (id) =>
        set((s) => ({
          subprojects: s.subprojects.map((sp) =>
            sp.id === id ? { ...sp, isCollapsed: !sp.isCollapsed } : sp
          ),
        })),

      reorderSubprojects: (orderedIds) =>
        set((s) => ({
          subprojects: orderedIds
            .map((id, i) => {
              const sp = s.subprojects.find((x) => x.id === id);
              return sp ? { ...sp, order: i } : null;
            })
            .filter(Boolean) as Subproject[],
        })),

      // ── Task Actions ──────────────────────────────────────
      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...task,
              id: generateId('task'),
              materialIds: [],
              commentIds: [],
              progress: 0,
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now() } : t
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks
            .filter((t) => t.id !== id)
            .map((t) => ({
              ...t,
              dependencies: t.dependencies.filter((d) => d !== id),
            })),
          materials: s.materials.filter((m) => m.taskId !== id),
          comments: s.comments.filter((c) => c.taskId !== id),
        })),

      toggleTaskComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isCompleted: !t.isCompleted,
                  status: !t.isCompleted ? 'done' : 'todo',
                  progress: !t.isCompleted ? 100 : 0,
                  updatedAt: now(),
                }
              : t
          ),
        })),

      moveTask: (taskId, newSubprojectId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subprojectId: newSubprojectId, updatedAt: now() }
              : t
          ),
        })),

      reorderTasks: (subprojectId, orderedIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.subprojectId !== subprojectId) return t;
            const idx = orderedIds.indexOf(t.id);
            return idx !== -1 ? { ...t, order: idx } : t;
          }),
        })),

      updateTaskDates: (id, startDate, endDate) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, startDate, endDate, updatedAt: now() } : t
          ),
        })),

      // ── Person Actions ────────────────────────────────────
      addPerson: (person) =>
        set((s) => ({
          persons: [
            ...s.persons,
            { ...person, id: generateId('person'), createdAt: now() },
          ],
        })),

      updatePerson: (id, updates) =>
        set((s) => ({
          persons: s.persons.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deletePerson: (id) =>
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => ({
            ...t,
            assigneeIds: t.assigneeIds.filter((aid) => aid !== id),
          })),
        })),

      // ── Material Actions ──────────────────────────────────
      addMaterial: (mat) => {
        const totalPrice = mat.quantity * mat.unitPrice;
        const id = generateId('mat');
        set((s) => ({
          materials: [
            ...s.materials,
            { ...mat, id, totalPrice, createdAt: now(), updatedAt: now() },
          ],
          tasks: s.tasks.map((t) =>
            t.id === mat.taskId
              ? { ...t, materialIds: [...t.materialIds, id] }
              : t
          ),
        }));
      },

      updateMaterial: (id, updates) =>
        set((s) => ({
          materials: s.materials.map((m) => {
            if (m.id !== id) return m;
            const updated = { ...m, ...updates, updatedAt: now() };
            // Recalculate total if quantity or unitPrice changed
            if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
              updated.totalPrice = updated.quantity * updated.unitPrice;
            }
            return updated;
          }),
        })),

      deleteMaterial: (id) =>
        set((s) => ({
          materials: s.materials.filter((m) => m.id !== id),
          tasks: s.tasks.map((t) => ({
            ...t,
            materialIds: t.materialIds.filter((mid) => mid !== id),
          })),
        })),

      updateMaterialStatus: (id, status) =>
        set((s) => ({
          materials: s.materials.map((m) =>
            m.id === id ? { ...m, status, updatedAt: now() } : m
          ),
        })),

      // ── Comment Actions ───────────────────────────────────
      addComment: (comment) => {
        const id = generateId('comment');
        set((s) => ({
          comments: [
            ...s.comments,
            { ...comment, id, isEdited: false, createdAt: now(), updatedAt: now() },
          ],
          tasks: s.tasks.map((t) =>
            t.id === comment.taskId
              ? { ...t, commentIds: [...t.commentIds, id] }
              : t
          ),
        }));
      },

      updateComment: (id, content) =>
        set((s) => ({
          comments: s.comments.map((c) =>
            c.id === id ? { ...c, content, isEdited: true, updatedAt: now() } : c
          ),
        })),

      deleteComment: (id) =>
        set((s) => ({
          comments: s.comments.filter((c) => c.id !== id),
          tasks: s.tasks.map((t) => ({
            ...t,
            commentIds: t.commentIds.filter((cid) => cid !== id),
          })),
        })),

      // ── Budget Actions ────────────────────────────────────
      addBudgetLine: (line) =>
        set((s) => ({
          budgetLines: [
            ...s.budgetLines,
            { ...line, id: generateId('budget'), createdAt: now(), updatedAt: now() },
          ],
        })),

      updateBudgetLine: (id, updates) =>
        set((s) => ({
          budgetLines: s.budgetLines.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: now() } : b
          ),
        })),

      deleteBudgetLine: (id) =>
        set((s) => ({
          budgetLines: s.budgetLines.filter((b) => b.id !== id),
        })),

      // ── UI Actions ────────────────────────────────────────
      setActiveView: (view) => set({ activeView: view }),
      setActiveSubproject: (id) => set({ activeSubprojectId: id }),
      selectTask: (id) => set({ selectedTaskId: id }),

      openTaskModal: (taskId) =>
        set({ isTaskModalOpen: true, selectedTaskId: taskId ?? null }),
      closeTaskModal: () =>
        set({ isTaskModalOpen: false, selectedTaskId: null }),

      openPersonsModal: () => set({ isPersonsModalOpen: true }),
      closePersonsModal: () => set({ isPersonsModalOpen: false }),

      toggleDarkMode: () =>
        set((s) => {
          const next = !s.isDarkMode;
          // Apply to <html> element for Tailwind dark class
          if (next) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          return { isDarkMode: next };
        }),

      setGanttViewMode: (mode) => set({ ganttViewMode: mode }),
      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterAssignees: (ids) => set({ filterAssigneeIds: ids }),
      setFilterStatus: (statuses) => set({ filterStatus: statuses }),
      setFilterPriority: (priorities) => set({ filterPriority: priorities }),
      clearFilters: () =>
        set({ searchQuery: '', filterAssigneeIds: [], filterStatus: [], filterPriority: [] }),

      // ── Computed Selectors ─────────────────────────────────
      getTasksBySubproject: (subprojectId) =>
        get()
          .tasks.filter((t) => t.subprojectId === subprojectId)
          .sort((a, b) => a.order - b.order),

      getFilteredTasks: () => {
        const { tasks, searchQuery, filterAssigneeIds, filterStatus, filterPriority, activeSubprojectId } =
          get();
        return tasks.filter((t) => {
          if (activeSubprojectId && t.subprojectId !== activeSubprojectId) return false;
          if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          if (filterAssigneeIds.length && !filterAssigneeIds.some((id) => t.assigneeIds.includes(id))) return false;
          if (filterStatus.length && !filterStatus.includes(t.status)) return false;
          if (filterPriority.length && !filterPriority.includes(t.priority)) return false;
          return true;
        });
      },

      getMaterialsByTask: (taskId) =>
        get().materials.filter((m) => m.taskId === taskId),

      getCommentsByTask: (taskId) =>
        get()
          .comments.filter((c) => c.taskId === taskId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),

      getBudgetSummary: (): BudgetSummary => {
        const { budgetLines, subprojects } = get();
        const totalEstimated = budgetLines.reduce((s, b) => s + b.estimated, 0);
        const totalActual = budgetLines.reduce((s, b) => s + b.actual, 0);
        const totalPaid = budgetLines.filter((b) => b.isPaid).reduce((s, b) => s + b.actual, 0);

        const bySubproject: BudgetSummary['bySubproject'] = {};
        subprojects.forEach((sp) => {
          const lines = budgetLines.filter((b) => b.subprojectId === sp.id);
          bySubproject[sp.id] = {
            subprojectId: sp.id,
            subprojectName: sp.name,
            estimated: lines.reduce((s, b) => s + b.estimated, 0),
            actual: lines.reduce((s, b) => s + b.actual, 0),
          };
        });

        const categories: BudgetCategory[] = ['materials', 'labor', 'tools', 'permits', 'design', 'contingency', 'other'];
        const byCategory = {} as Record<BudgetCategory, number>;
        categories.forEach((cat) => {
          byCategory[cat] = budgetLines
            .filter((b) => b.category === cat)
            .reduce((s, b) => s + b.estimated, 0);
        });

        return {
          totalEstimated,
          totalActual,
          totalPaid,
          totalRemaining: totalEstimated - totalActual,
          bySubproject,
          byCategory,
        };
      },

      getPersonById: (id) => get().persons.find((p) => p.id === id),
      getTaskById: (id) => get().tasks.find((t) => t.id === id),
      getSubprojectById: (id) => get().subprojects.find((sp) => sp.id === id),

      getDependentTasks: (taskId) =>
        get().tasks.filter((t) => t.dependencies.includes(taskId)),

      getTotalMaterialCost: (taskId) =>
        get()
          .materials.filter((m) => m.taskId === taskId)
          .reduce((sum, m) => sum + m.totalPrice, 0),
    }),
    {
      name: 'renovation-planner-v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist data, not UI state
      partialize: (state) => ({
        project: state.project,
        subprojects: state.subprojects,
        tasks: state.tasks,
        persons: state.persons,
        materials: state.materials,
        comments: state.comments,
        budgetLines: state.budgetLines,
        activeView: state.activeView,
        ganttViewMode: state.ganttViewMode,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);
