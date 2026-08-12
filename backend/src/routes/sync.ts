import { Router, Request, Response } from 'express';
import { io } from '../server';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

export const syncRouter = Router();

// File path for disk backup of shared state
const DATA_FILE = path.join(__dirname, '..', '..', 'shared-state.json');

const now = new Date().toISOString();

const defaultPersons = [
  {
    id: 'person-alice',
    name: 'Alice Jansen',
    label: 'Aannemer',
    color: '#0ea5e9',
    email: 'alice@verbouwing.nl',
    avatarInitials: 'AJ',
  },
  {
    id: 'person-bob',
    name: 'Bob de Vries',
    label: 'Elektricien',
    color: '#f59e0b',
    email: 'bob@elektra.nl',
    avatarInitials: 'BV',
  },
  {
    id: 'person-carol',
    name: 'Carol Smit',
    label: 'Loodgieter',
    color: '#10b981',
    email: 'carol@sanitair.nl',
    avatarInitials: 'CS',
  },
  {
    id: 'person-david',
    name: 'David Bakker',
    label: 'Eigenaar',
    color: '#8b5cf6',
    email: 'david@thuis.nl',
    avatarInitials: 'DB',
  },
];

const defaultUsers = [
  {
    id: 'person-alice',
    name: 'Alice Jansen',
    email: 'alice@verbouwing.nl',
    role: 'admin',
    roleTitle: 'Aannemer',
    avatarColor: '#0ea5e9',
    avatarInitials: 'AJ',
  },
  {
    id: 'person-bob',
    name: 'Bob de Vries',
    email: 'bob@elektra.nl',
    role: 'member',
    roleTitle: 'Elektricien',
    avatarColor: '#f59e0b',
    avatarInitials: 'BV',
  },
  {
    id: 'person-carol',
    name: 'Carol Smit',
    email: 'carol@sanitair.nl',
    role: 'member',
    roleTitle: 'Loodgieter',
    avatarColor: '#10b981',
    avatarInitials: 'CS',
  },
  {
    id: 'person-david',
    name: 'David Bakker',
    email: 'david@thuis.nl',
    role: 'viewer',
    roleTitle: 'Eigenaar',
    avatarColor: '#8b5cf6',
    avatarInitials: 'DB',
  },
];

const defaultProject = {
  id: 'project-verbouwing-2025',
  name: 'Verbouwing Thuis 2025',
  description: 'Volledige renovatie van de badkamer, begane grond isolatie, elektra vernieuwing en nieuwe keuken.',
  address: 'Voorbeeldstraat 12, 1234 AB Amsterdam',
  startDate: '2025-01-06',
  endDate: '2025-12-31',
  totalBudget: 85000,
  currency: 'EUR',
  createdAt: now,
  updatedAt: now,
};

const defaultSubprojects = [
  {
    id: 'sub-badkamer',
    projectId: 'project-verbouwing-2025',
    name: 'Badkamer',
    description: 'Volledige badkamer renovatie inclusief tegels, sanitair en douche.',
    color: 'blue',
    startDate: '2025-01-06',
    endDate: '2025-03-28',
    isCollapsed: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sub-isolatie',
    projectId: 'project-verbouwing-2025',
    name: 'Begane grond isolatie',
    description: 'Vloerisolatie en spouwmuurisolatie van de begane grond.',
    color: 'green',
    startDate: '2025-02-03',
    endDate: '2025-04-25',
    isCollapsed: false,
    order: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sub-elektra',
    projectId: 'project-verbouwing-2025',
    name: 'Elektra',
    description: 'Vernieuwen van de meterkast en aanleggen van nieuwe groepen.',
    color: 'yellow',
    startDate: '2025-03-03',
    endDate: '2025-05-30',
    isCollapsed: false,
    order: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sub-keuken',
    projectId: 'project-verbouwing-2025',
    name: 'Keuken',
    description: 'Plaatsen van een nieuwe keuken inclusief apparatuur en tegels.',
    color: 'orange',
    startDate: '2025-05-01',
    endDate: '2025-07-31',
    isCollapsed: false,
    order: 3,
    createdAt: now,
    updatedAt: now,
  },
];

const defaultTasks = [
  {
    id: 'task-sloop-badkamer',
    subprojectId: 'sub-badkamer',
    title: 'Sloopwerk badkamer',
    description: 'Verwijderen van oude tegels, sanitair en vloer.',
    status: 'done',
    priority: 'high',
    startDate: '2025-01-06',
    endDate: '2025-01-17',
    progress: 100,
    isCompleted: true,
    estimatedHours: 16,
    actualHours: 18,
    order: 0,
    tags: ['sloop', 'badkamer'],
    assigneeIds: ['person-alice', 'person-david'],
    dependencies: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-tegels-badkamer',
    subprojectId: 'sub-badkamer',
    title: 'Tegels plaatsen badkamer',
    description: 'Wand- en vloertegels plaatsen in de badkamer.',
    status: 'in_progress',
    priority: 'high',
    startDate: '2025-01-20',
    endDate: '2025-02-14',
    progress: 60,
    isCompleted: false,
    estimatedHours: 40,
    actualHours: 24,
    order: 1,
    tags: ['tegels', 'badkamer'],
    assigneeIds: ['person-alice'],
    dependencies: ['task-sloop-badkamer'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-sanitair',
    subprojectId: 'sub-badkamer',
    title: 'Sanitair installeren',
    description: 'Toilet, wastafel en douche aansluiten.',
    status: 'todo',
    priority: 'high',
    startDate: '2025-02-17',
    endDate: '2025-03-07',
    progress: 0,
    isCompleted: false,
    estimatedHours: 24,
    actualHours: 0,
    order: 2,
    tags: ['sanitair', 'loodgieter'],
    assigneeIds: ['person-carol'],
    dependencies: ['task-tegels-badkamer'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-afwerking-badkamer',
    subprojectId: 'sub-badkamer',
    title: 'Afwerking en schilderwerk badkamer',
    description: 'Voegen, kit en schilderwerk afmaken.',
    status: 'todo',
    priority: 'medium',
    startDate: '2025-03-10',
    endDate: '2025-03-28',
    progress: 0,
    isCompleted: false,
    estimatedHours: 12,
    actualHours: 0,
    order: 3,
    tags: ['afwerking', 'schilder'],
    assigneeIds: ['person-alice'],
    dependencies: ['task-sanitair'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-vloerisolatie',
    subprojectId: 'sub-isolatie',
    title: 'Vloerisolatie leggen',
    description: 'PIR-isolatieplaten onder de vloer aanbrengen.',
    status: 'in_progress',
    priority: 'medium',
    startDate: '2025-02-03',
    endDate: '2025-02-28',
    progress: 40,
    isCompleted: false,
    estimatedHours: 20,
    actualHours: 8,
    order: 0,
    tags: ['isolatie', 'vloer'],
    assigneeIds: ['person-alice'],
    dependencies: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-spouwmuur',
    subprojectId: 'sub-isolatie',
    title: 'Spouwmuurisolatie inblazen',
    description: 'EPS-parels inblazen in de spouwmuur via buitengevel.',
    status: 'todo',
    priority: 'medium',
    startDate: '2025-03-03',
    endDate: '2025-03-28',
    progress: 0,
    isCompleted: false,
    estimatedHours: 8,
    actualHours: 0,
    order: 1,
    tags: ['isolatie', 'spouwmuur'],
    assigneeIds: ['person-alice'],
    dependencies: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-meterkast',
    subprojectId: 'sub-elektra',
    title: 'Meterkast vervangen',
    description: 'Oude meterkast verwijderen en nieuwe groepenkast installeren.',
    status: 'todo',
    priority: 'high',
    startDate: '2025-03-03',
    endDate: '2025-03-21',
    progress: 0,
    isCompleted: false,
    estimatedHours: 16,
    actualHours: 0,
    order: 0,
    tags: ['elektra', 'meterkast'],
    assigneeIds: ['person-bob'],
    dependencies: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-groepen',
    subprojectId: 'sub-elektra',
    title: 'Nieuwe groepen aanleggen',
    description: 'Extra groepen aanleggen voor badkamer, keuken en buitenverlichting.',
    status: 'todo',
    priority: 'high',
    startDate: '2025-03-24',
    endDate: '2025-05-02',
    progress: 0,
    isCompleted: false,
    estimatedHours: 32,
    actualHours: 0,
    order: 1,
    tags: ['elektra', 'groepen'],
    assigneeIds: ['person-bob'],
    dependencies: ['task-meterkast'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-keuken-sloop',
    subprojectId: 'sub-keuken',
    title: 'Oude keuken slopen',
    description: 'Bestaande keukenkasten, aanrechtblad en apparatuur verwijderen.',
    status: 'todo',
    priority: 'high',
    startDate: '2025-05-01',
    endDate: '2025-05-09',
    progress: 0,
    isCompleted: false,
    estimatedHours: 8,
    actualHours: 0,
    order: 0,
    tags: ['sloop', 'keuken'],
    assigneeIds: ['person-alice', 'person-david'],
    dependencies: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-keuken-plaatsen',
    subprojectId: 'sub-keuken',
    title: 'Nieuwe keuken plaatsen',
    description: 'Keukenkasten, aanrechtblad en inbouwapparatuur monteren.',
    status: 'todo',
    priority: 'high',
    startDate: '2025-05-12',
    endDate: '2025-06-20',
    progress: 0,
    isCompleted: false,
    estimatedHours: 48,
    actualHours: 0,
    order: 1,
    tags: ['keuken', 'montage'],
    assigneeIds: ['person-alice'],
    dependencies: ['task-keuken-sloop'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-keuken-tegels',
    subprojectId: 'sub-keuken',
    title: 'Keuken achterwand betegelen',
    description: 'Metrotegels plaatsen als spatwand achter het aanrecht.',
    status: 'todo',
    priority: 'low',
    startDate: '2025-06-23',
    endDate: '2025-07-11',
    progress: 0,
    isCompleted: false,
    estimatedHours: 12,
    actualHours: 0,
    order: 2,
    tags: ['tegels', 'keuken'],
    assigneeIds: ['person-alice'],
    dependencies: ['task-keuken-plaatsen'],
    createdAt: now,
    updatedAt: now,
  },
];

const defaultMaterials = [
  {
    id: 'mat-tegels-wand',
    taskId: 'task-tegels-badkamer',
    name: 'Wandtegels 30x60 wit',
    quantity: 45,
    unit: 'm²',
    unitPrice: 28.5,
    totalPrice: 1282.5,
    status: 'ordered',
    supplier: 'Tegelhuis Amsterdam',
    supplierUrl: 'https://tegelhuis.nl',
    articleNumber: 'TH-WIT-3060',
    notes: 'Inclusief 10% uitvalpercentage',
    orderedAt: '2025-01-10',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-tegels-vloer',
    taskId: 'task-tegels-badkamer',
    name: 'Vloertegels 60x60 antraciet',
    quantity: 12,
    unit: 'm²',
    unitPrice: 42.0,
    totalPrice: 504.0,
    status: 'ordered',
    supplier: 'Tegelhuis Amsterdam',
    supplierUrl: 'https://tegelhuis.nl',
    articleNumber: 'TH-ANT-6060',
    notes: '',
    orderedAt: '2025-01-10',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-tegellijm',
    taskId: 'task-tegels-badkamer',
    name: 'Tegellijm flexibel (zak 25kg)',
    quantity: 8,
    unit: 'zakken',
    unitPrice: 18.95,
    totalPrice: 151.6,
    status: 'delivered',
    supplier: 'Gamma',
    supplierUrl: '',
    articleNumber: '',
    notes: '',
    orderedAt: '2025-01-08',
    deliveredAt: '2025-01-15',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-douche',
    taskId: 'task-sanitair',
    name: 'Inloopdouche 90x90 zwart frame',
    quantity: 1,
    unit: 'stuks',
    unitPrice: 649.0,
    totalPrice: 649.0,
    status: 'needed',
    supplier: 'Sanitairwinkel.nl',
    supplierUrl: 'https://sanitairwinkel.nl',
    articleNumber: 'SW-ILD-9090-ZW',
    notes: 'Levering 4-6 weken',
    orderedAt: '',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-wastafel',
    taskId: 'task-sanitair',
    name: 'Wastafelmeubel 80cm eiken',
    quantity: 1,
    unit: 'stuks',
    unitPrice: 489.0,
    totalPrice: 489.0,
    status: 'needed',
    supplier: 'Badkamerxl',
    supplierUrl: 'https://badkamerxl.nl',
    articleNumber: '',
    notes: '',
    orderedAt: '',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-pir-isolatie',
    taskId: 'task-vloerisolatie',
    name: 'PIR isolatieplaten 80mm (pak)',
    quantity: 20,
    unit: 'pakken',
    unitPrice: 87.5,
    totalPrice: 1750.0,
    status: 'delivered',
    supplier: 'Isolatieshop',
    supplierUrl: '',
    articleNumber: 'ISO-PIR-80',
    notes: '5m² per pak',
    orderedAt: '2025-01-27',
    deliveredAt: '2025-02-01',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-groepenkast',
    taskId: 'task-meterkast',
    name: 'Groepenkast 3-fase 24 groepen',
    quantity: 1,
    unit: 'stuks',
    unitPrice: 320.0,
    totalPrice: 320.0,
    status: 'needed',
    supplier: 'Elektramat',
    supplierUrl: 'https://elektramat.nl',
    articleNumber: 'EM-GK-3F-24',
    notes: '',
    orderedAt: '',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-keuken',
    taskId: 'task-keuken-plaatsen',
    name: 'Complete keuken opstelling (IKEA Metod)',
    quantity: 1,
    unit: 'set',
    unitPrice: 4800.0,
    totalPrice: 4800.0,
    status: 'needed',
    supplier: 'IKEA',
    supplierUrl: 'https://ikea.com',
    articleNumber: '',
    notes: 'Inclusief greeploos front, composiet aanrechtblad en spoelbak',
    orderedAt: '',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mat-metro-tegels',
    taskId: 'task-keuken-tegels',
    name: 'Metrotegels 7.5x15 mat wit',
    quantity: 8,
    unit: 'm²',
    unitPrice: 22.0,
    totalPrice: 176.0,
    status: 'needed',
    supplier: 'Tegelhuis Amsterdam',
    supplierUrl: 'https://tegelhuis.nl',
    articleNumber: 'TH-METRO-75',
    notes: '',
    orderedAt: '',
    deliveredAt: '',
    createdAt: now,
    updatedAt: now,
  },
];

const defaultComments = [
  {
    id: 'comment-1',
    taskId: 'task-tegels-badkamer',
    authorId: 'person-alice',
    authorName: 'Alice Jansen',
    content: 'De wandtegels zijn besteld bij Tegelhuis. Verwachte levering is volgende week dinsdag. Ik begin alvast met de vloertegels zodat we geen tijd verliezen.',
    createdAt: '2025-01-22T09:15:00Z',
    updatedAt: '2025-01-22T09:15:00Z',
    isEdited: false,
  },
  {
    id: 'comment-2',
    taskId: 'task-tegels-badkamer',
    authorId: 'person-david',
    authorName: 'David Bakker',
    content: 'Top! Vergeet niet de voegkleur af te stemmen — ik heb een voorkeur voor antraciet voeg bij de witte wandtegels. Heb je daar genoeg van op voorraad?',
    createdAt: '2025-01-22T11:30:00Z',
    updatedAt: '2025-01-22T11:30:00Z',
    isEdited: false,
  },
];

const defaultBudgetLines = [
  {
    id: 'budget-badkamer-materiaal',
    subprojectId: 'sub-badkamer',
    projectId: 'project-verbouwing-2025',
    taskId: '',
    description: 'Tegels en tegellijm badkamer',
    category: 'materials',
    estimated: 2200.0,
    actual: 1938.1,
    isPaid: true,
    paidAt: '2025-01-15',
    invoiceReference: 'TH-2025-0142',
    supplier: 'Tegelhuis Amsterdam',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'budget-badkamer-sanitair',
    subprojectId: 'sub-badkamer',
    projectId: 'project-verbouwing-2025',
    taskId: '',
    description: 'Sanitair: douche, wastafelmeubel, toilet',
    category: 'materials',
    estimated: 1800.0,
    actual: 0,
    isPaid: false,
    paidAt: '',
    invoiceReference: '',
    supplier: '',
    notes: 'Nog te bestellen',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'budget-badkamer-arbeid',
    subprojectId: 'sub-badkamer',
    projectId: 'project-verbouwing-2025',
    taskId: '',
    description: 'Arbeidskosten aannemer badkamer',
    category: 'labor',
    estimated: 3500.0,
    actual: 1200.0,
    isPaid: false,
    paidAt: '',
    invoiceReference: '',
    supplier: 'Alice Jansen Aannemersbedrijf',
    notes: 'Voorschot betaald, rest na oplevering',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'budget-isolatie-materiaal',
    subprojectId: 'sub-isolatie',
    projectId: 'project-verbouwing-2025',
    taskId: '',
    description: 'PIR isolatieplaten vloer',
    category: 'materials',
    estimated: 1800.0,
    actual: 1750.0,
    isPaid: true,
    paidAt: '2025-01-28',
    invoiceReference: 'ISO-2025-0089',
    supplier: 'Isolatieshop',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'budget-elektra-meterkast',
    subprojectId: 'sub-elektra',
    projectId: 'project-verbouwing-2025',
    taskId: '',
    description: 'Materiaalkosten meterkast en bekabeling',
    category: 'materials',
    estimated: 1200.0,
    actual: 0,
    isPaid: false,
    paidAt: '',
    invoiceReference: '',
    supplier: 'Elektramat',
    notes: '',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'budget-keuken-totaal',
    subprojectId: 'sub-keuken',
    projectId: 'project-verbouwing-2025',
    taskId: '',
    description: 'Complete keuken inclusief montage en tegels',
    category: 'materials',
    estimated: 7500.0,
    actual: 0,
    isPaid: false,
    paidAt: '',
    invoiceReference: '',
    supplier: 'IKEA',
    notes: 'Offerte ontvangen, definitieve keuze nog te maken',
    createdAt: now,
    updatedAt: now,
  },
];

// In-memory state store with persistent synchronization across all clients
let sharedState: {
  project?: any;
  subprojects: any[];
  tasks: any[];
  persons: any[];
  materials: any[];
  comments: any[];
  budgetLines: any[];
  users: any[];
  expenses: any[];
  availableUpgrades?: any[];
  projectUpgrades?: any[];
  lastUpdated: string;
} = {
  project: defaultProject,
  subprojects: defaultSubprojects,
  tasks: defaultTasks,
  persons: defaultPersons,
  materials: defaultMaterials,
  comments: defaultComments,
  budgetLines: defaultBudgetLines,
  users: defaultUsers,
  expenses: [],
  availableUpgrades: [],
  projectUpgrades: [],
  lastUpdated: new Date().toISOString(),
};

// Load saved state from disk if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const hasStoredTasks = Array.isArray(parsed.tasks) && parsed.tasks.length > 0;
      const hasStoredSubs = Array.isArray(parsed.subprojects) && parsed.subprojects.length > 0;

      sharedState = {
        ...sharedState,
        project: parsed.project || defaultProject,
        subprojects: hasStoredSubs ? parsed.subprojects : defaultSubprojects,
        tasks: hasStoredTasks ? parsed.tasks : defaultTasks,
        persons: Array.isArray(parsed.persons) && parsed.persons.length > 0 ? parsed.persons : defaultPersons,
        materials: Array.isArray(parsed.materials) && parsed.materials.length > 0 ? parsed.materials : defaultMaterials,
        comments: Array.isArray(parsed.comments) && parsed.comments.length > 0 ? parsed.comments : defaultComments,
        budgetLines: Array.isArray(parsed.budgetLines) && parsed.budgetLines.length > 0 ? parsed.budgetLines : defaultBudgetLines,
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaultUsers,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        availableUpgrades: parsed.availableUpgrades || [],
        projectUpgrades: parsed.projectUpgrades || [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
      console.log(`[Sync] Loaded state from disk (${sharedState.tasks.length} tasks, ${sharedState.expenses.length} expenses)`);
    }
  }
} catch (e) {
  console.warn('[Sync] Failed to load shared-state.json:', e);
}

// Attempt to load from PostgreSQL Prisma DB if connected
async function tryLoadFromPrisma() {
  try {
    const project = await prisma.project.findFirst({
      include: {
        subprojects: { orderBy: { order: 'asc' } },
      },
    });

    if (project) {
      const tasks = await prisma.task.findMany({
        include: {
          assignees: { include: { person: true } },
          dependsOn: true,
        },
        orderBy: { order: 'asc' },
      });

      const persons = await prisma.person.findMany();
      const materials = await prisma.material.findMany();
      const comments = await prisma.comment.findMany();
      const budgetLines = await prisma.budgetLine.findMany();

      if (tasks.length > 0 || project.subprojects.length > 0) {
        sharedState.project = project;
        sharedState.subprojects = project.subprojects;
        sharedState.tasks = tasks.map((t) => ({
          ...t,
          assigneeIds: t.assignees.map((a) => a.personId),
          dependencies: t.dependsOn.map((d) => d.prerequisiteTaskId),
        }));
        if (persons.length > 0) sharedState.persons = persons;
        if (materials.length > 0) sharedState.materials = materials;
        if (comments.length > 0) sharedState.comments = comments;
        if (budgetLines.length > 0) sharedState.budgetLines = budgetLines;
        console.log(`[Sync] Synced with Prisma PostgreSQL database (${tasks.length} tasks)`);
        persistSharedStateToDisk();
      }
    }
  } catch (err) {
    // Database not running locally, fallback to in-memory/disk store
  }
}
tryLoadFromPrisma();

let saveTimeout: any = null;
function persistSharedStateToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(sharedState, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Sync] Could not save state to disk:', err);
    }
  }, 300);
}

/**
 * Merge two arrays of entities by their `id` property.
 */
export function mergeEntitiesById<T extends { id?: string; updatedAt?: string; createdAt?: string }>(
  existingList: T[],
  incomingList: T[]
): T[] {
  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return existingList || [];
  }
  if (!Array.isArray(existingList) || existingList.length === 0) {
    return incomingList;
  }

  const map = new Map<string, T>();
  for (const item of existingList) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  for (const incoming of incomingList) {
    if (!incoming || !incoming.id) continue;
    const current = map.get(incoming.id);
    if (!current) {
      map.set(incoming.id, incoming);
    } else {
      const curTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
      const incTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;
      if (incTime >= curTime) {
        map.set(incoming.id, { ...current, ...incoming });
      } else {
        map.set(incoming.id, { ...incoming, ...current });
      }
    }
  }

  return Array.from(map.values());
}

export function getSharedState() {
  return sharedState;
}

export function updateSharedState(updates: Partial<typeof sharedState>) {
  if (!updates || typeof updates !== 'object') return sharedState;

  if (updates.project !== undefined && updates.project !== null) {
    sharedState.project = updates.project;
  }

  if (Array.isArray(updates.subprojects) && updates.subprojects.length > 0) {
    sharedState.subprojects = mergeEntitiesById(sharedState.subprojects, updates.subprojects);
  }
  if (Array.isArray(updates.tasks) && updates.tasks.length > 0) {
    sharedState.tasks = mergeEntitiesById(sharedState.tasks, updates.tasks);
  }
  if (Array.isArray(updates.persons) && updates.persons.length > 0) {
    sharedState.persons = mergeEntitiesById(sharedState.persons, updates.persons);
  }
  if (Array.isArray(updates.materials) && updates.materials.length > 0) {
    sharedState.materials = mergeEntitiesById(sharedState.materials, updates.materials);
  }
  if (Array.isArray(updates.comments) && updates.comments.length > 0) {
    sharedState.comments = mergeEntitiesById(sharedState.comments, updates.comments);
  }
  if (Array.isArray(updates.budgetLines) && updates.budgetLines.length > 0) {
    sharedState.budgetLines = mergeEntitiesById(sharedState.budgetLines, updates.budgetLines);
  }
  if (Array.isArray(updates.users) && updates.users.length > 0) {
    sharedState.users = mergeEntitiesById(sharedState.users, updates.users);
  }
  if (Array.isArray(updates.expenses)) {
    sharedState.expenses = mergeEntitiesById(sharedState.expenses, updates.expenses);
  }
  if (Array.isArray(updates.availableUpgrades) && updates.availableUpgrades.length > 0) {
    sharedState.availableUpgrades = mergeEntitiesById(sharedState.availableUpgrades || [], updates.availableUpgrades);
  }
  if (Array.isArray(updates.projectUpgrades) && updates.projectUpgrades.length > 0) {
    sharedState.projectUpgrades = mergeEntitiesById(sharedState.projectUpgrades || [], updates.projectUpgrades);
  }

  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();

  // Async sync to Railway PostgreSQL if available
  syncToPrismaDb(updates).catch(() => {});

  return sharedState;
}

async function syncToPrismaDb(updates: Partial<typeof sharedState>) {
  try {
    if (updates.project && updates.project.id) {
      await prisma.project.upsert({
        where: { id: updates.project.id },
        update: {
          name: updates.project.name,
          description: updates.project.description,
          address: updates.project.address,
          startDate: updates.project.startDate,
          endDate: updates.project.endDate,
          totalBudget: updates.project.totalBudget,
          currency: updates.project.currency,
        },
        create: {
          id: updates.project.id,
          name: updates.project.name,
          description: updates.project.description,
          address: updates.project.address,
          startDate: updates.project.startDate,
          endDate: updates.project.endDate,
          totalBudget: updates.project.totalBudget ?? 0,
          currency: updates.project.currency ?? 'EUR',
        },
      });
    }

    if (Array.isArray(updates.subprojects)) {
      for (const sp of updates.subprojects) {
        if (!sp || !sp.id || !sp.projectId) continue;
        await prisma.subproject.upsert({
          where: { id: sp.id },
          update: {
            name: sp.name,
            description: sp.description,
            color: sp.color,
            startDate: sp.startDate,
            endDate: sp.endDate,
            isCollapsed: sp.isCollapsed,
            order: sp.order,
          },
          create: {
            id: sp.id,
            projectId: sp.projectId,
            name: sp.name,
            description: sp.description,
            color: sp.color ?? 'blue',
            startDate: sp.startDate,
            endDate: sp.endDate,
            isCollapsed: sp.isCollapsed ?? false,
            order: sp.order ?? 0,
          },
        });
      }
    }

    if (Array.isArray(updates.tasks)) {
      for (const t of updates.tasks) {
        if (!t || !t.id || !t.subprojectId) continue;
        await prisma.task.upsert({
          where: { id: t.id },
          update: {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            startDate: t.startDate,
            endDate: t.endDate,
            progress: t.progress,
            isCompleted: t.isCompleted,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            order: t.order,
            tags: t.tags ?? [],
          },
          create: {
            id: t.id,
            subprojectId: t.subprojectId,
            title: t.title,
            description: t.description,
            status: t.status ?? 'todo',
            priority: t.priority ?? 'medium',
            startDate: t.startDate,
            endDate: t.endDate,
            progress: t.progress ?? 0,
            isCompleted: t.isCompleted ?? false,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            order: t.order ?? 0,
            tags: t.tags ?? [],
          },
        });
      }
    }
  } catch (err) {
    // Silently ignore if Railway Prisma DB is momentarily unreachable
  }
}

export function addOrUpdateExpenseInState(expense: any) {
  if (!expense || !expense.id) return;
  const existingIdx = sharedState.expenses.findIndex((e) => e.id === expense.id);
  if (existingIdx !== -1) {
    sharedState.expenses[existingIdx] = { ...sharedState.expenses[existingIdx], ...expense };
  } else {
    sharedState.expenses = [expense, ...sharedState.expenses];
  }
  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();
}

export function deleteExpenseFromState(expenseId: string) {
  if (!expenseId) return;
  sharedState.expenses = sharedState.expenses.filter((e) => e.id !== expenseId);
  sharedState.lastUpdated = new Date().toISOString();
  persistSharedStateToDisk();
}

// ─── GET /api/sync ────────────────────────────────────────────────────────────
syncRouter.get('/', async (_req: Request, res: Response) => {
  if (sharedState.tasks.length === 0 || sharedState.subprojects.length === 0) {
    await tryLoadFromPrisma();
  }

  res.json({
    success: true,
    data: sharedState,
  });
});

// ─── POST /api/sync ───────────────────────────────────────────────────────────
syncRouter.post('/', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const updated = updateSharedState(payload);

    try {
      if (io) {
        io.emit('state:synced', updated);
      }
    } catch (e) {
      console.warn('Socket broadcast warning:', e);
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('Error in /api/sync:', err);
    res.status(500).json({ error: 'Failed to sync state' });
  }
});
