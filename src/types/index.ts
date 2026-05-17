// ============================================================
// CORE ENUMERATIONS
// ============================================================

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type MaterialStatus = 'needed' | 'ordered' | 'delivered' | 'installed' | 'returned';

export type SubprojectColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'yellow'
  | 'pink'
  | 'cyan'
  | 'teal';

export type GanttViewMode = 'Day' | 'Week' | 'Month';

export type ActiveView = 'gantt' | 'kanban' | 'list' | 'budget';

// ============================================================
// PEOPLE / RESOURCES
// ============================================================

export interface Person {
  id: string;
  name: string;
  /** Short display label, e.g. "Ik", "Partner" */
  label: string;
  /** Hex color for avatar badge */
  color: string;
  /** Optional email for future collaboration features */
  email?: string;
  avatarInitials: string;
  createdAt: string; // ISO date string
}

// ============================================================
// SUBPROJECTS (FASES)
// ============================================================

export interface Subproject {
  id: string;
  name: string;
  description?: string;
  color: SubprojectColor;
  /** ISO date strings */
  startDate: string;
  endDate: string;
  /** Whether this phase is collapsed in Gantt/sidebar */
  isCollapsed: boolean;
  /** Sort order */
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// MATERIALS
// ============================================================

export interface Material {
  id: string;
  taskId: string;
  name: string;
  quantity: number;
  unit: string; // e.g. "m²", "stuks", "liter", "meter"
  unitPrice: number; // in euros
  totalPrice: number; // quantity * unitPrice
  status: MaterialStatus;
  supplier?: string;
  supplierUrl?: string;
  articleNumber?: string;
  notes?: string;
  orderedAt?: string; // ISO date
  deliveredAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// COMMENTS
// ============================================================

export interface Comment {
  id: string;
  taskId: string;
  authorId: string; // references Person.id
  authorName: string; // denormalized for display
  content: string;
  /** Attached image URLs or file links */
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'link';
  size?: number; // bytes
}

// ============================================================
// TASKS
// ============================================================

export interface Task {
  id: string;
  subprojectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  /** ISO date strings */
  startDate: string;
  endDate: string;

  /** IDs of tasks that must finish before this one can start */
  dependencies: string[];

  /** Assigned person IDs */
  assigneeIds: string[];

  /** Completion percentage 0–100 */
  progress: number;

  /** Whether manually marked complete (separate from status) */
  isCompleted: boolean;

  /** Estimated hours */
  estimatedHours?: number;
  actualHours?: number;

  /** Sort order within subproject */
  order: number;

  /** Tags / labels for filtering */
  tags: string[];

  /** Linked materials (IDs) */
  materialIds: string[];

  /** Linked comments (IDs) */
  commentIds: string[];

  createdAt: string;
  updatedAt: string;
}

// ============================================================
// BUDGET
// ============================================================

export interface BudgetLine {
  id: string;
  subprojectId: string;
  taskId?: string; // optional: tied to a specific task
  description: string;
  category: BudgetCategory;
  estimated: number;
  actual: number;
  isPaid: boolean;
  paidAt?: string;
  invoiceReference?: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BudgetCategory =
  | 'materials'
  | 'labor'
  | 'tools'
  | 'permits'
  | 'design'
  | 'contingency'
  | 'other';

export interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  totalRemaining: number;
  bySubproject: Record<string, SubprojectBudget>;
  byCategory: Record<BudgetCategory, number>;
}

export interface SubprojectBudget {
  subprojectId: string;
  subprojectName: string;
  estimated: number;
  actual: number;
}

// ============================================================
// PROJECT (ROOT ENTITY)
// ============================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  address?: string;
  /** ISO date strings for overall project timeline */
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string; // e.g. "EUR"
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// APP STATE SHAPE (for Zustand)
// ============================================================

export interface RenovationStore {
  // ── Entities ──────────────────────────────────────────────
  project: Project;
  subprojects: Subproject[];
  tasks: Task[];
  persons: Person[];
  materials: Material[];
  comments: Comment[];
  budgetLines: BudgetLine[];

  // ── UI State ──────────────────────────────────────────────
  activeView: ActiveView;
  activeSubprojectId: string | null;
  selectedTaskId: string | null;
  ganttViewMode: GanttViewMode;
  isTaskModalOpen: boolean;
  isPersonsModalOpen: boolean;
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  filterAssigneeIds: string[];
  filterStatus: TaskStatus[];
  filterPriority: TaskPriority[];

  // ── Project Actions ───────────────────────────────────────
  updateProject: (updates: Partial<Project>) => void;

  // ── Subproject Actions ────────────────────────────────────
  addSubproject: (subproject: Omit<Subproject, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubproject: (id: string, updates: Partial<Subproject>) => void;
  deleteSubproject: (id: string) => void;
  toggleSubprojectCollapsed: (id: string) => void;
  reorderSubprojects: (orderedIds: string[]) => void;

  // ── Task Actions ──────────────────────────────────────────
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'materialIds' | 'commentIds' | 'progress'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  moveTask: (taskId: string, newSubprojectId: string) => void;
  reorderTasks: (subprojectId: string, orderedIds: string[]) => void;
  updateTaskDates: (id: string, startDate: string, endDate: string) => void;

  // ── Person Actions ────────────────────────────────────────
  addPerson: (person: Omit<Person, 'id' | 'createdAt'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;

  // ── Material Actions ──────────────────────────────────────
  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'totalPrice'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  updateMaterialStatus: (id: string, status: MaterialStatus) => void;

  // ── Comment Actions ───────────────────────────────────────
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'isEdited'>) => void;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;

  // ── Budget Actions ────────────────────────────────────────
  addBudgetLine: (line: Omit<BudgetLine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudgetLine: (id: string, updates: Partial<BudgetLine>) => void;
  deleteBudgetLine: (id: string) => void;

  // ── UI Actions ────────────────────────────────────────────
  setActiveView: (view: ActiveView) => void;
  setActiveSubproject: (id: string | null) => void;
  selectTask: (id: string | null) => void;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;
  openPersonsModal: () => void;
  closePersonsModal: () => void;
  toggleDarkMode: () => void;
  setGanttViewMode: (mode: GanttViewMode) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setFilterAssignees: (ids: string[]) => void;
  setFilterStatus: (statuses: TaskStatus[]) => void;
  setFilterPriority: (priorities: TaskPriority[]) => void;
  clearFilters: () => void;

  // ── Computed Selectors ────────────────────────────────────
  getTasksBySubproject: (subprojectId: string) => Task[];
  getFilteredTasks: () => Task[];
  getMaterialsByTask: (taskId: string) => Material[];
  getCommentsByTask: (taskId: string) => Comment[];
  getBudgetSummary: () => BudgetSummary;
  getPersonById: (id: string) => Person | undefined;
  getTaskById: (id: string) => Task | undefined;
  getSubprojectById: (id: string) => Subproject | undefined;
  getDependentTasks: (taskId: string) => Task[];
  getTotalMaterialCost: (taskId: string) => number;
}
