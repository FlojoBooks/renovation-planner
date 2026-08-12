import { format, addDays } from 'date-fns';
import type {
  Project,
  Subproject,
  Task,
  Person,
  Material,
  Comment,
  BudgetLine,
  User,
  UpgradeOption,
  ProjectUpgrade,
} from '../types';

const now = new Date().toISOString();
const today = format(new Date(), 'yyyy-MM-dd');
const inTwoMonths = format(addDays(new Date(), 60), 'yyyy-MM-dd');

// ── Schoon Project Zonder Mock Data ────────────────────────
export const seedProject: Project = {
  id: 'proj-001',
  name: 'Mijn Project',
  description: '',
  address: '',
  startDate: today,
  endDate: inTwoMonths,
  totalBudget: 0,
  currency: 'EUR',
  createdAt: now,
  updatedAt: now,
};

// ── Schone Personen & Gebruikers ───────────────────────────
export const seedPersons: Person[] = [];
export const seedUsers: User[] = [];

// ── Geen hardcoded demo data (volledig schoon) ─────────────
export const seedSubprojects: Subproject[] = [];
export const seedTasks: Task[] = [];
export const seedMaterials: Material[] = [];
export const seedComments: Comment[] = [];
export const seedBudgetLines: BudgetLine[] = [];
export const seedProjectUpgrades: ProjectUpgrade[] = [];
export const seedAvailableUpgrades: UpgradeOption[] = [];

// ── Aggregated seed export ─────────────────────────────────
export const seedData = {
  project: seedProject,
  subprojects: seedSubprojects,
  tasks: seedTasks,
  persons: seedPersons,
  materials: seedMaterials,
  comments: seedComments,
  budgetLines: seedBudgetLines,
  users: seedUsers,
  currentUser: null as User | null,
  availableUpgrades: seedAvailableUpgrades,
  projectUpgrades: seedProjectUpgrades,
};
