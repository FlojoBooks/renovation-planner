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

export type ActiveView = 'gantt' | 'kanban' | 'list' | 'budget' | 'expenses' | 'upgrades';

// ============================================================
// USERS & ROLES
// ============================================================

export type UserRole =
  | 'owner'         // Opdrachtgever / Eigenaar
  | 'partner'       // Partner / Mede-eigenaar
  | 'contractor'    // Hoofdaannemer
  | 'subcontractor' // Onderaannemer / Vakman (bijv. elektricien, loodgieter)
  | 'architect';    // Architect / Adviseur

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  role: UserRole;
  roleTitle?: string;
  company?: string;
  phone?: string;
  avatarColor: string;
  avatarInitials: string;
  createdAt: string;
}

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
  role?: UserRole;
  userId?: string; // Optional reference to registered User
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
// UPGRADES & MEERWERK
// ============================================================

export type UpgradeCategory =
  | 'technique'       // Techniek, Motor & Carrosserie
  | 'interior'        // Interieur, Afwerking & Ruimte
  | 'equipment'       // Apparatuur, Keuken & Installaties
  | 'sustainability'  // Duurzaamheid, Accu & Elektra
  | 'branding'        // Branding, Styling & Show
  | 'custom';         // Maatwerk

export type UpgradeStatus = 'available' | 'requested' | 'approved' | 'in_progress' | 'completed';

export interface UpgradeTaskTemplate {
  title: string;
  description?: string;
  estimatedHours?: number;
  priority: TaskPriority;
  daysOffset: number; // relative start day
  durationDays: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  category: UpgradeCategory;
  estimatedCost: number;
  popular?: boolean;
  roiBadge?: string; // e.g. "Bespaart €800/jaar" or "Waardevermeerderend"
  tags: string[];
  tasksTemplate: UpgradeTaskTemplate[];
}

export interface ProjectUpgrade {
  id: string;
  upgradeOptionId: string;
  title: string;
  category: UpgradeCategory;
  status: UpgradeStatus;
  agreedPrice: number;
  notes?: string;
  subprojectId?: string;
  addedAt: string;
  completedAt?: string;
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
  completedAt?: string;
  completionNote?: string;
  completedByUserId?: string;

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

  /** Linked upgrade ID (if originated from an upgrade) */
  upgradeId?: string;

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
  upgradeId?: string; // optional: tied to an upgrade
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
// EXPENSES, PAYMENTS & SETTLEMENT ("Wie Betaalt Wat")
// ============================================================

export type PaymentCategory =
  | 'materials'
  | 'tools'
  | 'labor'
  | 'fuel'
  | 'catering'
  | 'equipment'
  | 'administrative'
  | 'other';

export interface PaymentExpense {
  id: string;
  title: string;
  amount: number;
  paidByUserId: string;
  paidByUserName: string;
  date: string; // YYYY-MM-DD
  category: PaymentCategory;
  receiptImage?: string; // compressed base64
  receiptThumbnail?: string;
  receiptFileName?: string;
  splitAmongUserIds: string[]; // User IDs that share this expense
  subprojectId?: string;
  taskId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettlement {
  userId: string;
  userName: string;
  avatarColor: string;
  avatarInitials: string;
  totalPaid: number;
  fairShare: number;
  netBalance: number; // Positive = receives back, Negative = owes
}

export interface SettlementTransfer {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface SettlementSummary {
  totalSpent: number;
  userSettlements: UserSettlement[];
  transfers: SettlementTransfer[];
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
  users: User[];
  currentUser: User | null;
  availableUpgrades: UpgradeOption[];
  projectUpgrades: ProjectUpgrade[];
  expenses: PaymentExpense[];

  // ── UI State ──────────────────────────────────────────────
  activeView: ActiveView;
  activeSubprojectId: string | null;
  selectedTaskId: string | null;
  ganttViewMode: GanttViewMode;
  isTaskModalOpen: boolean;
  isPersonsModalOpen: boolean;
  isAuthModalOpen: boolean;
  isExpenseModalOpen: boolean;
  isInviteModalOpen: boolean;
  selectedReceiptImage: string | null;
  editingExpenseId: string | null;
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  filterAssigneeIds: string[];
  filterStatus: TaskStatus[];
  filterPriority: TaskPriority[];
  filterOnlyMyTasks: boolean;

  // ── Auth Actions ──────────────────────────────────────────
  setCurrentUser: (user: User | null) => void;
  loginUser: (email: string, password?: string) => { success: boolean; error?: string };
  loginUserAsync: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  registerUserAsync: (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash' | 'passwordSalt'> & { password?: string }) => Promise<User>;
  switchUser: (userId: string) => void;
  logoutUser: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  generateInviteLink: (role?: UserRole, expiresInDays?: number) => string;

  // ── Expense Actions ───────────────────────────────────────
  openExpenseModal: (expenseId?: string) => void;
  closeExpenseModal: () => void;
  openReceiptLightbox: (imageUrl: string) => void;
  closeReceiptLightbox: () => void;
  addExpense: (expense: Omit<PaymentExpense, 'id' | 'createdAt' | 'updatedAt'>) => PaymentExpense;
  updateExpense: (id: string, updates: Partial<PaymentExpense>) => void;
  deleteExpense: (id: string) => void;
  getSettlementSummary: () => SettlementSummary;

  // ── Upgrade Actions ───────────────────────────────────────
  addUpgradeToProject: (upgradeOptionId: string, customPrice?: number) => void;
  removeUpgradeFromProject: (projectUpgradeId: string) => void;
  updateUpgradeStatus: (projectUpgradeId: string, status: UpgradeStatus) => void;
  createCustomUpgrade: (upgrade: Omit<UpgradeOption, 'id'>) => void;

  // ── Project Actions ───────────────────────────────────────
  updateProject: (updates: Partial<Project>) => void;

  // ── Subproject Actions ────────────────────────────────────
  addSubproject: (subproject: Omit<Subproject, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubproject: (id: string, updates: Partial<Subproject>) => void;
  deleteSubproject: (id: string) => void;
  toggleSubprojectCollapsed: (id: string) => void;
  reorderSubprojects: (orderedIds: string[]) => void;

  // ── Sync Actions ──────────────────────────────────────────
  applyRemoteState: (remote: any) => void;

  // ── Task Actions ──────────────────────────────────────────
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'materialIds' | 'commentIds' | 'progress'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string, completionNote?: string) => void;
  markTaskCompleteWithDetails: (id: string, note?: string) => void;
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
  toggleFilterOnlyMyTasks: () => void;
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
