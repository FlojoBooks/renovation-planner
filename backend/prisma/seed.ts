import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean up existing data ───────────────────────────────────────────────
  await prisma.comment.deleteMany();
  await prisma.material.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.subproject.deleteMany();
  await prisma.person.deleteMany();
  await prisma.project.deleteMany();

  // ─── Persons ──────────────────────────────────────────────────────────────
  const alice = await prisma.person.create({
    data: {
      id: 'person-alice',
      name: 'Alice Jansen',
      label: 'Aannemer',
      color: '#0ea5e9',
      email: 'alice@verbouwing.nl',
      avatarInitials: 'AJ',
    },
  });

  const bob = await prisma.person.create({
    data: {
      id: 'person-bob',
      name: 'Bob de Vries',
      label: 'Elektricien',
      color: '#f59e0b',
      email: 'bob@elektra.nl',
      avatarInitials: 'BV',
    },
  });

  const carol = await prisma.person.create({
    data: {
      id: 'person-carol',
      name: 'Carol Smit',
      label: 'Loodgieter',
      color: '#10b981',
      email: 'carol@sanitair.nl',
      avatarInitials: 'CS',
    },
  });

  const david = await prisma.person.create({
    data: {
      id: 'person-david',
      name: 'David Bakker',
      label: 'Eigenaar',
      color: '#8b5cf6',
      email: 'david@thuis.nl',
      avatarInitials: 'DB',
    },
  });

  console.log('✅ Persons created');

  // ─── Project ──────────────────────────────────────────────────────────────
  const project = await prisma.project.create({
    data: {
      id: 'project-verbouwing-2025',
      name: 'Verbouwing Thuis 2025',
      description:
        'Volledige renovatie van de badkamer, begane grond isolatie, elektra vernieuwing en nieuwe keuken.',
      address: 'Voorbeeldstraat 12, 1234 AB Amsterdam',
      startDate: '2025-01-06',
      endDate: '2025-12-31',
      totalBudget: 85000,
      currency: 'EUR',
    },
  });

  console.log('✅ Project created');

  // ─── Subprojects ──────────────────────────────────────────────────────────
  const subBadkamer = await prisma.subproject.create({
    data: {
      id: 'sub-badkamer',
      projectId: project.id,
      name: 'Badkamer',
      description: 'Volledige badkamer renovatie inclusief tegels, sanitair en douche.',
      color: 'blue',
      startDate: '2025-01-06',
      endDate: '2025-03-28',
      isCollapsed: false,
      order: 0,
    },
  });

  const subIsolatie = await prisma.subproject.create({
    data: {
      id: 'sub-isolatie',
      projectId: project.id,
      name: 'Begane grond isolatie',
      description: 'Vloerisolatie en spouwmuurisolatie van de begane grond.',
      color: 'green',
      startDate: '2025-02-03',
      endDate: '2025-04-25',
      isCollapsed: false,
      order: 1,
    },
  });

  const subElektra = await prisma.subproject.create({
    data: {
      id: 'sub-elektra',
      projectId: project.id,
      name: 'Elektra',
      description: 'Vernieuwen van de meterkast en aanleggen van nieuwe groepen.',
      color: 'yellow',
      startDate: '2025-03-03',
      endDate: '2025-05-30',
      isCollapsed: false,
      order: 2,
    },
  });

  const subKeuken = await prisma.subproject.create({
    data: {
      id: 'sub-keuken',
      projectId: project.id,
      name: 'Keuken',
      description: 'Plaatsen van een nieuwe keuken inclusief apparatuur en tegels.',
      color: 'orange',
      startDate: '2025-05-01',
      endDate: '2025-07-31',
      isCollapsed: false,
      order: 3,
    },
  });

  console.log('✅ Subprojects created');

  // ─── Tasks ────────────────────────────────────────────────────────────────

  // Badkamer tasks
  const taskSloop = await prisma.task.create({
    data: {
      id: 'task-sloop-badkamer',
      subprojectId: subBadkamer.id,
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
    },
  });

  const taskTegelsBadkamer = await prisma.task.create({
    data: {
      id: 'task-tegels-badkamer',
      subprojectId: subBadkamer.id,
      title: 'Tegels plaatsen badkamer',
      description: 'Wand- en vloertegels plaatsen in de badkamer.',
      status: 'in-progress',
      priority: 'high',
      startDate: '2025-01-20',
      endDate: '2025-02-14',
      progress: 60,
      isCompleted: false,
      estimatedHours: 40,
      actualHours: 24,
      order: 1,
      tags: ['tegels', 'badkamer'],
    },
  });

  const taskSanitair = await prisma.task.create({
    data: {
      id: 'task-sanitair',
      subprojectId: subBadkamer.id,
      title: 'Sanitair installeren',
      description: 'Toilet, wastafel en douche aansluiten.',
      status: 'todo',
      priority: 'high',
      startDate: '2025-02-17',
      endDate: '2025-03-07',
      progress: 0,
      isCompleted: false,
      estimatedHours: 24,
      actualHours: null,
      order: 2,
      tags: ['sanitair', 'loodgieter'],
    },
  });

  const taskAfwerkingBadkamer = await prisma.task.create({
    data: {
      id: 'task-afwerking-badkamer',
      subprojectId: subBadkamer.id,
      title: 'Afwerking en schilderwerk badkamer',
      description: 'Voegen, kit en schilderwerk afmaken.',
      status: 'todo',
      priority: 'medium',
      startDate: '2025-03-10',
      endDate: '2025-03-28',
      progress: 0,
      isCompleted: false,
      estimatedHours: 12,
      actualHours: null,
      order: 3,
      tags: ['afwerking', 'schilder'],
    },
  });

  // Isolatie tasks
  const taskVloerisolatie = await prisma.task.create({
    data: {
      id: 'task-vloerisolatie',
      subprojectId: subIsolatie.id,
      title: 'Vloerisolatie leggen',
      description: 'PIR-isolatieplaten onder de vloer aanbrengen.',
      status: 'in-progress',
      priority: 'medium',
      startDate: '2025-02-03',
      endDate: '2025-02-28',
      progress: 40,
      isCompleted: false,
      estimatedHours: 20,
      actualHours: 8,
      order: 0,
      tags: ['isolatie', 'vloer'],
    },
  });

  const taskSpouwmuur = await prisma.task.create({
    data: {
      id: 'task-spouwmuur',
      subprojectId: subIsolatie.id,
      title: 'Spouwmuurisolatie inblazen',
      description: 'EPS-parels inblazen in de spouwmuur via buitengevel.',
      status: 'todo',
      priority: 'medium',
      startDate: '2025-03-03',
      endDate: '2025-03-28',
      progress: 0,
      isCompleted: false,
      estimatedHours: 8,
      actualHours: null,
      order: 1,
      tags: ['isolatie', 'spouwmuur'],
    },
  });

  // Elektra tasks
  const taskMeterkast = await prisma.task.create({
    data: {
      id: 'task-meterkast',
      subprojectId: subElektra.id,
      title: 'Meterkast vervangen',
      description: 'Oude meterkast verwijderen en nieuwe groepenkast installeren.',
      status: 'todo',
      priority: 'high',
      startDate: '2025-03-03',
      endDate: '2025-03-21',
      progress: 0,
      isCompleted: false,
      estimatedHours: 16,
      actualHours: null,
      order: 0,
      tags: ['elektra', 'meterkast'],
    },
  });

  const taskGroepen = await prisma.task.create({
    data: {
      id: 'task-groepen',
      subprojectId: subElektra.id,
      title: 'Nieuwe groepen aanleggen',
      description: 'Extra groepen aanleggen voor badkamer, keuken en buitenverlichting.',
      status: 'todo',
      priority: 'high',
      startDate: '2025-03-24',
      endDate: '2025-05-02',
      progress: 0,
      isCompleted: false,
      estimatedHours: 32,
      actualHours: null,
      order: 1,
      tags: ['elektra', 'groepen'],
    },
  });

  // Keuken tasks
  const taskKeukenSloop = await prisma.task.create({
    data: {
      id: 'task-keuken-sloop',
      subprojectId: subKeuken.id,
      title: 'Oude keuken slopen',
      description: 'Bestaande keukenkasten, aanrechtblad en apparatuur verwijderen.',
      status: 'todo',
      priority: 'high',
      startDate: '2025-05-01',
      endDate: '2025-05-09',
      progress: 0,
      isCompleted: false,
      estimatedHours: 8,
      actualHours: null,
      order: 0,
      tags: ['sloop', 'keuken'],
    },
  });

  const taskKeukenPlaatsen = await prisma.task.create({
    data: {
      id: 'task-keuken-plaatsen',
      subprojectId: subKeuken.id,
      title: 'Nieuwe keuken plaatsen',
      description: 'Keukenkasten, aanrechtblad en inbouwapparatuur monteren.',
      status: 'todo',
      priority: 'high',
      startDate: '2025-05-12',
      endDate: '2025-06-20',
      progress: 0,
      isCompleted: false,
      estimatedHours: 48,
      actualHours: null,
      order: 1,
      tags: ['keuken', 'montage'],
    },
  });

  const taskKeukenTegels = await prisma.task.create({
    data: {
      id: 'task-keuken-tegels',
      subprojectId: subKeuken.id,
      title: 'Keuken achterwand betegelen',
      description: 'Metrotegels plaatsen als spatwand achter het aanrecht.',
      status: 'todo',
      priority: 'low',
      startDate: '2025-06-23',
      endDate: '2025-07-11',
      progress: 0,
      isCompleted: false,
      estimatedHours: 12,
      actualHours: null,
      order: 2,
      tags: ['tegels', 'keuken'],
    },
  });

  console.log('✅ Tasks created');

  // ─── Task Assignees ───────────────────────────────────────────────────────
  await prisma.taskAssignee.createMany({
    data: [
      // Badkamer
      { taskId: taskSloop.id, personId: alice.id },
      { taskId: taskSloop.id, personId: david.id },
      { taskId: taskTegelsBadkamer.id, personId: alice.id },
      { taskId: taskSanitair.id, personId: carol.id },
      { taskId: taskAfwerkingBadkamer.id, personId: alice.id },
      // Isolatie
      { taskId: taskVloerisolatie.id, personId: alice.id },
      { taskId: taskSpouwmuur.id, personId: alice.id },
      // Elektra
      { taskId: taskMeterkast.id, personId: bob.id },
      { taskId: taskGroepen.id, personId: bob.id },
      // Keuken
      { taskId: taskKeukenSloop.id, personId: alice.id },
      { taskId: taskKeukenSloop.id, personId: david.id },
      { taskId: taskKeukenPlaatsen.id, personId: alice.id },
      { taskId: taskKeukenTegels.id, personId: alice.id },
    ],
  });

  console.log('✅ Task assignees created');

  // ─── Task Dependencies ────────────────────────────────────────────────────
  await prisma.taskDependency.createMany({
    data: [
      // Tegels pas na sloop
      { dependentTaskId: taskTegelsBadkamer.id, prerequisiteTaskId: taskSloop.id },
      // Sanitair pas na tegels
      { dependentTaskId: taskSanitair.id, prerequisiteTaskId: taskTegelsBadkamer.id },
      // Afwerking pas na sanitair
      { dependentTaskId: taskAfwerkingBadkamer.id, prerequisiteTaskId: taskSanitair.id },
      // Nieuwe groepen pas na meterkast
      { dependentTaskId: taskGroepen.id, prerequisiteTaskId: taskMeterkast.id },
      // Keuken plaatsen pas na sloop keuken
      { dependentTaskId: taskKeukenPlaatsen.id, prerequisiteTaskId: taskKeukenSloop.id },
      // Keuken tegels pas na keuken plaatsen
      { dependentTaskId: taskKeukenTegels.id, prerequisiteTaskId: taskKeukenPlaatsen.id },
    ],
  });

  console.log('✅ Task dependencies created');

  // ─── Materials ────────────────────────────────────────────────────────────
  await prisma.material.createMany({
    data: [
      // Badkamer tegels
      {
        id: 'mat-tegels-wand',
        taskId: taskTegelsBadkamer.id,
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
        deliveredAt: null,
      },
      {
        id: 'mat-tegels-vloer',
        taskId: taskTegelsBadkamer.id,
        name: 'Vloertegels 60x60 antraciet',
        quantity: 12,
        unit: 'm²',
        unitPrice: 42.0,
        totalPrice: 504.0,
        status: 'ordered',
        supplier: 'Tegelhuis Amsterdam',
        supplierUrl: 'https://tegelhuis.nl',
        articleNumber: 'TH-ANT-6060',
        notes: null,
        orderedAt: '2025-01-10',
        deliveredAt: null,
      },
      {
        id: 'mat-tegellijm',
        taskId: taskTegelsBadkamer.id,
        name: 'Tegellijm flexibel (zak 25kg)',
        quantity: 8,
        unit: 'zakken',
        unitPrice: 18.95,
        totalPrice: 151.6,
        status: 'delivered',
        supplier: 'Gamma',
        supplierUrl: null,
        articleNumber: null,
        notes: null,
        orderedAt: '2025-01-08',
        deliveredAt: '2025-01-15',
      },
      // Sanitair
      {
        id: 'mat-douche',
        taskId: taskSanitair.id,
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
        orderedAt: null,
        deliveredAt: null,
      },
      {
        id: 'mat-wastafel',
        taskId: taskSanitair.id,
        name: 'Wastafelmeubel 80cm eiken',
        quantity: 1,
        unit: 'stuks',
        unitPrice: 489.0,
        totalPrice: 489.0,
        status: 'needed',
        supplier: 'Badkamerxl',
        supplierUrl: 'https://badkamerxl.nl',
        articleNumber: null,
        notes: null,
        orderedAt: null,
        deliveredAt: null,
      },
      // Vloerisolatie
      {
        id: 'mat-pir-isolatie',
        taskId: taskVloerisolatie.id,
        name: 'PIR isolatieplaten 80mm (pak)',
        quantity: 20,
        unit: 'pakken',
        unitPrice: 87.5,
        totalPrice: 1750.0,
        status: 'delivered',
        supplier: 'Isolatieshop',
        supplierUrl: null,
        articleNumber: 'ISO-PIR-80',
        notes: '5m² per pak',
        orderedAt: '2025-01-27',
        deliveredAt: '2025-02-01',
      },
      // Meterkast
      {
        id: 'mat-groepenkast',
        taskId: taskMeterkast.id,
        name: 'Groepenkast 3-fase 24 groepen',
        quantity: 1,
        unit: 'stuks',
        unitPrice: 320.0,
        totalPrice: 320.0,
        status: 'needed',
        supplier: 'Elektramat',
        supplierUrl: 'https://elektramat.nl',
        articleNumber: 'EM-GK-3F-24',
        notes: null,
        orderedAt: null,
        deliveredAt: null,
      },
      // Keuken
      {
        id: 'mat-keuken',
        taskId: taskKeukenPlaatsen.id,
        name: 'Complete keuken opstelling (IKEA Metod)',
        quantity: 1,
        unit: 'set',
        unitPrice: 4800.0,
        totalPrice: 4800.0,
        status: 'needed',
        supplier: 'IKEA',
        supplierUrl: 'https://ikea.com',
        articleNumber: null,
        notes: 'Inclusief greeploos front, composiet aanrechtblad en spoelbak',
        orderedAt: null,
        deliveredAt: null,
      },
      {
        id: 'mat-metro-tegels',
        taskId: taskKeukenTegels.id,
        name: 'Metrotegels 7.5x15 mat wit',
        quantity: 8,
        unit: 'm²',
        unitPrice: 22.0,
        totalPrice: 176.0,
        status: 'needed',
        supplier: 'Tegelhuis Amsterdam',
        supplierUrl: 'https://tegelhuis.nl',
        articleNumber: 'TH-METRO-75',
        notes: null,
        orderedAt: null,
        deliveredAt: null,
      },
    ],
  });

  console.log('✅ Materials created');

  // ─── Comments ─────────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      {
        id: 'comment-1',
        taskId: taskTegelsBadkamer.id,
        authorId: alice.id,
        authorName: alice.name,
        content:
          'De wandtegels zijn besteld bij Tegelhuis. Verwachte levering is volgende week dinsdag. Ik begin alvast met de vloertegels zodat we geen tijd verliezen.',
        isEdited: false,
        createdAt: new Date('2025-01-22T09:15:00Z'),
        updatedAt: new Date('2025-01-22T09:15:00Z'),
      },
      {
        id: 'comment-2',
        taskId: taskTegelsBadkamer.id,
        authorId: david.id,
        authorName: david.name,
        content:
          'Top! Vergeet niet de voegkleur af te stemmen — ik heb een voorkeur voor antraciet voeg bij de witte wandtegels. Heb je daar genoeg van op voorraad?',
        isEdited: false,
        createdAt: new Date('2025-01-22T11:30:00Z'),
        updatedAt: new Date('2025-01-22T11:30:00Z'),
      },
    ],
  });

  console.log('✅ Comments created');

  // ─── Budget Lines ─────────────────────────────────────────────────────────
  await prisma.budgetLine.createMany({
    data: [
      {
        id: 'budget-badkamer-materiaal',
        subprojectId: subBadkamer.id,
        projectId: project.id,
        taskId: null,
        description: 'Tegels en tegellijm badkamer',
        category: 'materials',
        estimated: 2200.0,
        actual: 1938.1,
        isPaid: true,
        paidAt: '2025-01-15',
        invoiceReference: 'TH-2025-0142',
        supplier: 'Tegelhuis Amsterdam',
        notes: null,
      },
      {
        id: 'budget-badkamer-sanitair',
        subprojectId: subBadkamer.id,
        projectId: project.id,
        taskId: null,
        description: 'Sanitair: douche, wastafelmeubel, toilet',
        category: 'materials',
        estimated: 1800.0,
        actual: 0,
        isPaid: false,
        paidAt: null,
        invoiceReference: null,
        supplier: null,
        notes: 'Nog te bestellen',
      },
      {
        id: 'budget-badkamer-arbeid',
        subprojectId: subBadkamer.id,
        projectId: project.id,
        taskId: null,
        description: 'Arbeidskosten aannemer badkamer',
        category: 'labor',
        estimated: 3500.0,
        actual: 1200.0,
        isPaid: false,
        paidAt: null,
        invoiceReference: null,
        supplier: 'Alice Jansen Aannemersbedrijf',
        notes: 'Voorschot betaald, rest na oplevering',
      },
      {
        id: 'budget-isolatie-materiaal',
        subprojectId: subIsolatie.id,
        projectId: project.id,
        taskId: null,
        description: 'PIR isolatieplaten vloer',
        category: 'materials',
        estimated: 1800.0,
        actual: 1750.0,
        isPaid: true,
        paidAt: '2025-01-28',
        invoiceReference: 'ISO-2025-0089',
        supplier: 'Isolatieshop',
        notes: null,
      },
      {
        id: 'budget-elektra-meterkast',
        subprojectId: subElektra.id,
        projectId: project.id,
        taskId: null,
        description: 'Materiaalkosten meterkast en bekabeling',
        category: 'materials',
        estimated: 1200.0,
        actual: 0,
        isPaid: false,
        paidAt: null,
        invoiceReference: null,
        supplier: 'Elektramat',
        notes: null,
      },
      {
        id: 'budget-keuken-totaal',
        subprojectId: subKeuken.id,
        projectId: project.id,
        taskId: null,
        description: 'Complete keuken inclusief montage en tegels',
        category: 'materials',
        estimated: 7500.0,
        actual: 0,
        isPaid: false,
        paidAt: null,
        invoiceReference: null,
        supplier: 'IKEA',
        notes: 'Offerte ontvangen, definitieve keuze nog te maken',
      },
    ],
  });

  console.log('✅ Budget lines created');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
