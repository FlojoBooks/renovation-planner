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

// ── Schoon Project ─────────────────────────────────────────
export const seedProject: Project = {
  id: 'proj-001',
  name: 'Mijn Project',
  description: 'Voeg hier je projectomschrijving toe...',
  address: '',
  startDate: today,
  endDate: inTwoMonths,
  totalBudget: 0,
  currency: 'EUR',
  createdAt: now,
  updatedAt: now,
};

// ── Geen voorgedefinieerde gebruikers (start volledig schoon) ─
export const seedUsers: User[] = [];
export const seedPersons: Person[] = [];

// ── Geen hardcoded testdata ────────────────────────────────
export const seedSubprojects: Subproject[] = [];
export const seedTasks: Task[] = [];
export const seedMaterials: Material[] = [];
export const seedComments: Comment[] = [];
export const seedBudgetLines: BudgetLine[] = [];
export const seedProjectUpgrades: ProjectUpgrade[] = [];

// ── Veelzijdige Upgrade / Optie Templates ──────────────────
export const seedAvailableUpgrades: UpgradeOption[] = [
  {
    id: 'upg-technique-general',
    title: 'Techniek & Revisie Pakket',
    description: 'Grondige technische keuring, onderhoud en vervanging van slijtagegevoelige onderdelen.',
    category: 'technique',
    estimatedCost: 1250,
    popular: true,
    roiBadge: 'Betrouwbaarheid & Duurzaamheid',
    tags: ['Techniek', 'Onderhoud'],
    tasksTemplate: [
      {
        title: 'Inspectie & nulmeting techniek',
        priority: 'high',
        estimatedHours: 4,
        daysOffset: 0,
        durationDays: 1,
      },
      {
        title: 'Vervanging & afstelling onderdelen',
        priority: 'critical',
        estimatedHours: 8,
        daysOffset: 2,
        durationDays: 2,
      },
    ],
  },
  {
    id: 'upg-power-solar',
    title: 'Off-Grid Accu & Duurzame Stroomvoorziening',
    description: 'Plaatsing van een accupakket met omvormer voor zelfstandige stroomvoorziening op locatie.',
    category: 'sustainability',
    estimatedCost: 1950,
    popular: true,
    roiBadge: '100% Zelfvoorzienend',
    tags: ['Elektra', 'Duurzaam', 'Off-Grid'],
    tasksTemplate: [
      {
        title: 'Installatie accupakket & laadregelaar',
        priority: 'critical',
        estimatedHours: 6,
        daysOffset: 0,
        durationDays: 2,
      },
      {
        title: 'Aansluiten 230V wandcontactdozen & testen',
        priority: 'high',
        estimatedHours: 4,
        daysOffset: 2,
        durationDays: 1,
      },
    ],
  },
  {
    id: 'upg-branding-styling',
    title: 'Huisstijl, Verlichting & Afwerking',
    description: 'Op maat gemaakte styling, sfeerverlichting en professionele visuele afwerking.',
    category: 'branding',
    estimatedCost: 850,
    roiBadge: 'Professionele Uitstraling',
    tags: ['Styling', 'Branding'],
    tasksTemplate: [
      {
        title: 'Montage sfeerverlichting & decoratie',
        priority: 'medium',
        estimatedHours: 6,
        daysOffset: 0,
        durationDays: 2,
      },
    ],
  },
];

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
