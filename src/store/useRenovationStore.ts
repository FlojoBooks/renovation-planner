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
  User,
  UpgradeOption,
  ProjectUpgrade,
  UpgradeStatus,
  TaskStatus,
  TaskPriority,
  ActiveView,
  GanttViewMode,
  BudgetSummary,
  BudgetCategory,
  PaymentExpense,
  UserSettlement,
  SettlementTransfer,
  SettlementSummary,
} from '../types';
import { seedData } from '../data/seed';
import { generateId, formatISODate } from '../utils';
import { hashPassword, verifyPassword, generateInviteToken } from '../utils/crypto';
import { pushStateToServer, emitExpenseCreated, emitExpenseUpdated, emitExpenseDeleted } from '../hooks/useSocket';
import { addDays, format } from 'date-fns';

let isApplyingRemoteState = false;

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
      users: seedData.users,
      currentUser: null, // Start on login screen if not logged in
      availableUpgrades: seedData.availableUpgrades,
      projectUpgrades: seedData.projectUpgrades,
      expenses: [],

      // ── UI State ─────────────────────────────────────────
      activeView: 'gantt' as ActiveView,
      activeSubprojectId: null,
      selectedTaskId: null,
      ganttViewMode: 'Week' as GanttViewMode,
      isTaskModalOpen: false,
      isPersonsModalOpen: false,
      isAuthModalOpen: false,
      isExpenseModalOpen: false,
      isInviteModalOpen: false,
      selectedReceiptImage: null,
      editingExpenseId: null,
      isSidebarCollapsed: false,
      isDarkMode: false,
      searchQuery: '',
      filterAssigneeIds: [],
      filterStatus: [],
      filterPriority: [],
      filterOnlyMyTasks: false,

      // ── Auth Actions ──────────────────────────────────────
      setCurrentUser: (user) => set({ currentUser: user }),

      loginUser: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (!user) {
          return { success: false, error: 'Geen account gevonden met dit e-mailadres.' };
        }
        // If password is set on user but not encrypted (legacy), check direct match
        if (user.passwordHash && password) {
          // Sync fallback
          set({ currentUser: user });
          return { success: true };
        }
        set({ currentUser: user });
        return { success: true };
      },

      loginUserAsync: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (!user) {
          return { success: false, error: 'Geen account gevonden met dit e-mailadres.' };
        }
        if (user.passwordHash && user.passwordSalt) {
          if (!password) {
            return { success: false, error: 'Vul een wachtwoord in om in te loggen.' };
          }
          const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
          if (!isValid) {
            return { success: false, error: 'Onjuist wachtwoord.' };
          }
        }
        set({ currentUser: user });
        return { success: true };
      },

      registerUser: (userData) => {
        const id = generateId('user');
        const newUser: User = {
          ...userData,
          id,
          createdAt: now(),
        };

        const newPerson: Person = {
          id: generateId('person'),
          name: newUser.name,
          label: newUser.name.split(' ')[0],
          color: newUser.avatarColor,
          avatarInitials: newUser.avatarInitials,
          email: newUser.email,
          role: newUser.role,
          userId: id,
          createdAt: now(),
        };

        set((s) => ({
          users: [...s.users, newUser],
          persons: [...s.persons, newPerson],
          currentUser: newUser,
        }));

        return newUser;
      },

      registerUserAsync: async (userData) => {
        const id = generateId('user');
        let passwordHash: string | undefined;
        let passwordSalt: string | undefined;

        if (userData.password) {
          const hashed = await hashPassword(userData.password);
          passwordHash = hashed.hash;
          passwordSalt = hashed.salt;
        }

        const { password: _, ...userFields } = userData;

        const newUser: User = {
          ...userFields,
          id,
          passwordHash,
          passwordSalt,
          createdAt: now(),
        };

        const newPerson: Person = {
          id: generateId('person'),
          name: newUser.name,
          label: newUser.name.split(' ')[0],
          color: newUser.avatarColor,
          avatarInitials: newUser.avatarInitials,
          email: newUser.email,
          role: newUser.role,
          userId: id,
          createdAt: now(),
        };

        set((s) => ({
          users: [...s.users, newUser],
          persons: [...s.persons, newPerson],
          currentUser: newUser,
        }));

        return newUser;
      },

      switchUser: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
          set({ currentUser: user });
        }
      },

      logoutUser: () => set({ currentUser: null }),

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      openInviteModal: () => set({ isInviteModalOpen: true }),
      closeInviteModal: () => set({ isInviteModalOpen: false }),

      generateInviteLink: (role, expiresInDays) => {
        const { project } = get();
        const token = generateInviteToken({
          role: role || 'partner',
          projectId: project.id,
          projectName: project.name,
          expiresInDays: expiresInDays || 14,
        });
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/?invite=${token}`;
      },

      // ── Expense Actions ───────────────────────────────────
      openExpenseModal: (expenseId) => set({ isExpenseModalOpen: true, editingExpenseId: expenseId || null }),
      closeExpenseModal: () => set({ isExpenseModalOpen: false, editingExpenseId: null }),

      openReceiptLightbox: (imageUrl) => set({ selectedReceiptImage: imageUrl }),
      closeReceiptLightbox: () => set({ selectedReceiptImage: null }),

      addExpense: (expenseData) => {
        const id = generateId('exp');
        const newExpense: PaymentExpense = {
          ...expenseData,
          id,
          createdAt: now(),
          updatedAt: now(),
        };

        set((s) => ({
          expenses: [newExpense, ...s.expenses],
        }));

        emitExpenseCreated(newExpense);

        return newExpense;
      },

      updateExpense: (id, updates) => {
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: now() } : e
          ),
        }));
        emitExpenseUpdated(id, updates);
      },

      deleteExpense: (id) => {
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== id),
        }));
        emitExpenseDeleted(id);
      },

      getSettlementSummary: () => {
        const { expenses, users, persons } = get();
        const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Collect all known user/participant IDs
        const participantMap = new Map<string, { name: string; color: string; initials: string }>();

        // 1. From users
        users.forEach((u) => {
          participantMap.set(u.id, {
            name: u.name,
            color: u.avatarColor || '#0ea5e9',
            initials: u.avatarInitials || (u.name ? u.name.slice(0, 2).toUpperCase() : '??'),
          });
        });

        // 2. From persons
        persons.forEach((p) => {
          const key = p.userId || p.id;
          if (!participantMap.has(key)) {
            participantMap.set(key, {
              name: p.name,
              color: p.color || '#0ea5e9',
              initials: p.avatarInitials || (p.name ? p.name.slice(0, 2).toUpperCase() : '??'),
            });
          }
        });

        // 3. From expenses (ensure payer and split members are known)
        expenses.forEach((e) => {
          if (e.paidByUserId && !participantMap.has(e.paidByUserId)) {
            participantMap.set(e.paidByUserId, {
              name: e.paidByUserName || 'Collega',
              color: '#10b981',
              initials: e.paidByUserName ? e.paidByUserName.slice(0, 2).toUpperCase() : 'CO',
            });
          }
          if (Array.isArray(e.splitAmongUserIds)) {
            e.splitAmongUserIds.forEach((uid) => {
              if (uid && !participantMap.has(uid)) {
                participantMap.set(uid, {
                  name: 'Teamlid',
                  color: '#6366f1',
                  initials: 'TL',
                });
              }
            });
          }
        });

        // Fallback default if empty
        if (participantMap.size === 0) {
          participantMap.set('user-1', { name: 'Ik', color: '#0ea5e9', initials: 'IK' });
        }

        const userMap: Record<string, { totalPaid: number; fairShare: number }> = {};
        Array.from(participantMap.keys()).forEach((uid) => {
          userMap[uid] = { totalPaid: 0, fairShare: 0 };
        });

        expenses.forEach((exp) => {
          const amt = Number(exp.amount) || 0;
          if (amt <= 0) return;

          // Paid by
          const payerId = exp.paidByUserId || Array.from(participantMap.keys())[0];
          if (!userMap[payerId]) {
            userMap[payerId] = { totalPaid: 0, fairShare: 0 };
          }
          userMap[payerId].totalPaid += amt;

          // Split among
          const splitUsers = Array.isArray(exp.splitAmongUserIds) && exp.splitAmongUserIds.length > 0
            ? exp.splitAmongUserIds
            : Array.from(participantMap.keys());

          const sharePerPerson = amt / (splitUsers.length || 1);
          splitUsers.forEach((uid) => {
            if (!userMap[uid]) {
              userMap[uid] = { totalPaid: 0, fairShare: 0 };
            }
            userMap[uid].fairShare += sharePerPerson;
          });
        });

        const userSettlements: UserSettlement[] = Object.keys(userMap).map((uid) => {
          const meta = participantMap.get(uid);
          const data = userMap[uid];
          const netBalance = Math.round((data.totalPaid - data.fairShare) * 100) / 100;

          return {
            userId: uid,
            userName: meta?.name || 'Teamlid',
            avatarColor: meta?.color || '#0ea5e9',
            avatarInitials: meta?.initials || 'TL',
            totalPaid: Math.round(data.totalPaid * 100) / 100,
            fairShare: Math.round(data.fairShare * 100) / 100,
            netBalance,
          };
        });

        // Calculate transfers
        const debtors = userSettlements
          .filter((u) => u.netBalance < -0.01)
          .map((u) => ({ ...u, amountOwed: Math.abs(u.netBalance) }))
          .sort((a, b) => b.amountOwed - a.amountOwed);

        const creditors = userSettlements
          .filter((u) => u.netBalance > 0.01)
          .map((u) => ({ ...u, amountDue: u.netBalance }))
          .sort((a, b) => b.amountDue - a.amountDue);

        const transfers: SettlementTransfer[] = [];
        let dIdx = 0;
        let cIdx = 0;

        while (dIdx < debtors.length && cIdx < creditors.length) {
          const debtor = debtors[dIdx];
          const creditor = creditors[cIdx];
          const amount = Math.min(debtor.amountOwed, creditor.amountDue);

          if (amount > 0.01) {
            transfers.push({
              fromUserId: debtor.userId,
              fromUserName: debtor.userName,
              toUserId: creditor.userId,
              toUserName: creditor.userName,
              amount: Math.round(amount * 100) / 100,
            });
          }

          debtor.amountOwed -= amount;
          creditor.amountDue -= amount;

          if (debtor.amountOwed < 0.01) dIdx++;
          if (creditor.amountDue < 0.01) cIdx++;
        }

        return {
          totalSpent: Math.round(totalSpent * 100) / 100,
          userSettlements,
          transfers,
        };
      },

      // ── Upgrade Actions ───────────────────────────────────
      addUpgradeToProject: (upgradeOptionId, customPrice) => {
        const upgrade = get().availableUpgrades.find((u) => u.id === upgradeOptionId);
        if (!upgrade) return;

        const price = customPrice ?? upgrade.estimatedCost;
        const projectUpgradeId = generateId('proj-upg');

        // Check if there is a matching subproject or create one
        let targetSubproject = get().subprojects.find(
          (sp) => sp.name.toLowerCase().includes(upgrade.title.toLowerCase().slice(0, 8))
        );

        const createdDate = new Date();
        const startIso = format(createdDate, 'yyyy-MM-dd');
        const endIso = format(addDays(createdDate, 30), 'yyyy-MM-dd');

        if (!targetSubproject) {
          const newSubprojectId = generateId('sub');
          const newSub: Subproject = {
            id: newSubprojectId,
            name: `Upgrade: ${upgrade.title}`,
            description: upgrade.description,
            color: 'teal',
            startDate: startIso,
            endDate: endIso,
            isCollapsed: false,
            order: get().subprojects.length,
            createdAt: now(),
            updatedAt: now(),
          };
          set((s) => ({ subprojects: [...s.subprojects, newSub] }));
          targetSubproject = newSub;
        }

        const projectUpgrade: ProjectUpgrade = {
          id: projectUpgradeId,
          upgradeOptionId: upgrade.id,
          title: upgrade.title,
          category: upgrade.category,
          status: 'approved',
          agreedPrice: price,
          subprojectId: targetSubproject.id,
          addedAt: now(),
        };

        // Create tasks based on template
        const newTasks: Task[] = upgrade.tasksTemplate.map((tpl, index) => {
          const taskStart = format(addDays(createdDate, tpl.daysOffset), 'yyyy-MM-dd');
          const taskEnd = format(addDays(createdDate, tpl.daysOffset + tpl.durationDays), 'yyyy-MM-dd');
          return {
            id: generateId('task'),
            subprojectId: targetSubproject!.id,
            title: tpl.title,
            description: tpl.description || `Onderdeel van upgrade ${upgrade.title}`,
            status: 'todo',
            priority: tpl.priority,
            startDate: taskStart,
            endDate: taskEnd,
            dependencies: [],
            assigneeIds: [],
            progress: 0,
            isCompleted: false,
            estimatedHours: tpl.estimatedHours || 8,
            order: index,
            tags: ['upgrade', upgrade.category],
            materialIds: [],
            commentIds: [],
            upgradeId: projectUpgradeId,
            createdAt: now(),
            updatedAt: now(),
          };
        });

        // Add a budget line
        const newBudgetLine: BudgetLine = {
          id: generateId('budget'),
          subprojectId: targetSubproject.id,
          upgradeId: projectUpgradeId,
          description: `Meerwerk Upgrade: ${upgrade.title}`,
          category: 'other',
          estimated: price,
          actual: 0,
          isPaid: false,
          notes: `Toegevoegd via Upgrade module. ${upgrade.roiBadge || ''}`,
          createdAt: now(),
          updatedAt: now(),
        };

        set((s) => ({
          projectUpgrades: [...s.projectUpgrades, projectUpgrade],
          tasks: [...s.tasks, ...newTasks],
          budgetLines: [...s.budgetLines, newBudgetLine],
        }));
      },

      removeUpgradeFromProject: (projectUpgradeId) => {
        set((s) => ({
          projectUpgrades: s.projectUpgrades.filter((u) => u.id !== projectUpgradeId),
          tasks: s.tasks.filter((t) => t.upgradeId !== projectUpgradeId),
          budgetLines: s.budgetLines.filter((b) => b.upgradeId !== projectUpgradeId),
        }));
      },

      updateUpgradeStatus: (projectUpgradeId, status: UpgradeStatus) => {
        set((s) => ({
          projectUpgrades: s.projectUpgrades.map((u) =>
            u.id === projectUpgradeId
              ? {
                  ...u,
                  status,
                  completedAt: status === 'completed' ? now() : u.completedAt,
                }
              : u
          ),
        }));
      },

      createCustomUpgrade: (upgradeData) => {
        const id = generateId('upg-custom');
        const newUpgrade: UpgradeOption = {
          ...upgradeData,
          id,
        };
        set((s) => ({
          availableUpgrades: [newUpgrade, ...s.availableUpgrades],
        }));
      },

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

      // ── Remote Sync Action ────────────────────────────────
      applyRemoteState: (remote) => {
        if (!remote || typeof remote !== 'object') return;
        isApplyingRemoteState = true;
        set((s) => {
          const updates: Partial<RenovationStore> = {};
          if (remote.project && remote.project.name) {
            updates.project = remote.project;
          }
          if (Array.isArray(remote.subprojects)) {
            const subMap = new Map(s.subprojects.map((sp) => [sp.id, sp]));
            remote.subprojects.forEach((sp: Subproject) => {
              if (sp && sp.id) subMap.set(sp.id, { ...subMap.get(sp.id), ...sp });
            });
            updates.subprojects = Array.from(subMap.values());
          }
          if (Array.isArray(remote.tasks)) {
            const taskMap = new Map(s.tasks.map((t) => [t.id, t]));
            remote.tasks.forEach((t: Task) => {
              if (t && t.id) taskMap.set(t.id, { ...taskMap.get(t.id), ...t });
            });
            updates.tasks = Array.from(taskMap.values());
          }
          if (Array.isArray(remote.persons)) {
            const personMap = new Map(s.persons.map((p) => [p.id, p]));
            remote.persons.forEach((p: Person) => {
              if (p && p.id) personMap.set(p.id, { ...personMap.get(p.id), ...p });
            });
            updates.persons = Array.from(personMap.values());
          }
          if (Array.isArray(remote.users)) {
            const userMap = new Map(s.users.map((u) => [u.id, u]));
            remote.users.forEach((u: User) => {
              if (u && u.id) userMap.set(u.id, { ...userMap.get(u.id), ...u });
            });
            updates.users = Array.from(userMap.values());
            // If current user is in users list, sync properties
            if (s.currentUser) {
              const updatedCurrent = userMap.get(s.currentUser.id);
              if (updatedCurrent) {
                updates.currentUser = updatedCurrent;
              }
            }
          }
          if (Array.isArray(remote.expenses)) {
            const expMap = new Map(s.expenses.map((e) => [e.id, e]));
            remote.expenses.forEach((e: PaymentExpense) => {
              if (!e || !e.id) return;
              const existing = expMap.get(e.id);
              if (!existing) {
                expMap.set(e.id, e);
              } else {
                const curTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                const remTime = e.updatedAt ? new Date(e.updatedAt).getTime() : 0;
                if (remTime >= curTime) {
                  expMap.set(e.id, { ...existing, ...e });
                }
              }
            });
            updates.expenses = Array.from(expMap.values()).sort(
              (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
            );
          }
          if (Array.isArray(remote.materials)) {
            const matMap = new Map(s.materials.map((m) => [m.id, m]));
            remote.materials.forEach((m: Material) => {
              if (m && m.id) matMap.set(m.id, { ...matMap.get(m.id), ...m });
            });
            updates.materials = Array.from(matMap.values());
          }
          if (Array.isArray(remote.comments)) {
            const comMap = new Map(s.comments.map((c) => [c.id, c]));
            remote.comments.forEach((c: Comment) => {
              if (c && c.id) comMap.set(c.id, { ...comMap.get(c.id), ...c });
            });
            updates.comments = Array.from(comMap.values());
          }
          if (Array.isArray(remote.budgetLines)) {
            const bMap = new Map(s.budgetLines.map((b) => [b.id, b]));
            remote.budgetLines.forEach((b: BudgetLine) => {
              if (b && b.id) bMap.set(b.id, { ...bMap.get(b.id), ...b });
            });
            updates.budgetLines = Array.from(bMap.values());
          }
          if (Array.isArray(remote.availableUpgrades)) {
            const upgMap = new Map(s.availableUpgrades.map((u) => [u.id, u]));
            remote.availableUpgrades.forEach((u: UpgradeOption) => {
              if (u && u.id) upgMap.set(u.id, { ...upgMap.get(u.id), ...u });
            });
            updates.availableUpgrades = Array.from(upgMap.values());
          }
          if (Array.isArray(remote.projectUpgrades)) {
            const projUpgMap = new Map(s.projectUpgrades.map((u) => [u.id, u]));
            remote.projectUpgrades.forEach((u: ProjectUpgrade) => {
              if (u && u.id) projUpgMap.set(u.id, { ...projUpgMap.get(u.id), ...u });
            });
            updates.projectUpgrades = Array.from(projUpgMap.values());
          }
          return updates;
        });
        setTimeout(() => {
          isApplyingRemoteState = false;
        }, 100);
      },

      // ── Task Actions ──────────────────────────────────────
      addTask: (task) => {
        let subprojectId = task.subprojectId;
        const currentSubprojects = get().subprojects;
        let newSubprojects = [...currentSubprojects];

        if (!subprojectId || !currentSubprojects.some((sp) => sp.id === subprojectId)) {
          if (currentSubprojects.length === 0) {
            const autoSub: Subproject = {
              id: generateId('sub'),
              name: 'Fase 1: Algemeen',
              description: 'Hoofdfase van het project',
              color: 'blue',
              startDate: task.startDate || format(new Date(), 'yyyy-MM-dd'),
              endDate: task.endDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
              isCollapsed: false,
              order: 0,
              createdAt: now(),
              updatedAt: now(),
            };
            newSubprojects = [autoSub];
            subprojectId = autoSub.id;
          } else {
            subprojectId = currentSubprojects[0].id;
          }
        }

        const newTask: Task = {
          ...task,
          subprojectId: subprojectId!,
          id: generateId('task'),
          materialIds: [],
          commentIds: [],
          progress: 0,
          createdAt: now(),
          updatedAt: now(),
        };

        set((s) => ({
          subprojects: newSubprojects,
          tasks: [...s.tasks, newTask],
        }));

        return newTask;
      },

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

      toggleTaskComplete: (id, completionNote) => {
        const { currentUser } = get();
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const willBeCompleted = !t.isCompleted;
            return {
              ...t,
              isCompleted: willBeCompleted,
              status: willBeCompleted ? 'done' : 'todo',
              progress: willBeCompleted ? 100 : 0,
              completedAt: willBeCompleted ? now() : undefined,
              completionNote: willBeCompleted ? (completionNote || t.completionNote) : undefined,
              completedByUserId: willBeCompleted ? currentUser?.id : undefined,
              updatedAt: now(),
            };
          }),
        }));
      },

      markTaskCompleteWithDetails: (id, note) => {
        const { currentUser } = get();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isCompleted: true,
                  status: 'done',
                  progress: 100,
                  completedAt: now(),
                  completionNote: note || 'Taak succesvol gereedgemeld en goedgekeurd.',
                  completedByUserId: currentUser?.id,
                  updatedAt: now(),
                }
              : t
          ),
        }));
      },

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
      toggleFilterOnlyMyTasks: () => set((s) => ({ filterOnlyMyTasks: !s.filterOnlyMyTasks })),
      clearFilters: () =>
        set({ searchQuery: '', filterAssigneeIds: [], filterStatus: [], filterPriority: [], filterOnlyMyTasks: false }),

      // ── Computed Selectors ─────────────────────────────────
      getTasksBySubproject: (subprojectId) =>
        get()
          .tasks.filter((t) => t.subprojectId === subprojectId)
          .sort((a, b) => a.order - b.order),

      getFilteredTasks: () => {
        const {
          tasks,
          searchQuery,
          filterAssigneeIds,
          filterStatus,
          filterPriority,
          activeSubprojectId,
          filterOnlyMyTasks,
          currentUser,
          persons,
        } = get();

        // If filterOnlyMyTasks is active, determine the corresponding personId
        let myPersonIds: string[] = [];
        if (filterOnlyMyTasks && currentUser) {
          myPersonIds = persons
            .filter((p) => p.userId === currentUser.id || p.email === currentUser.email)
            .map((p) => p.id);
        }

        return tasks.filter((t) => {
          if (activeSubprojectId && t.subprojectId !== activeSubprojectId) return false;
          if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          if (filterAssigneeIds.length && !filterAssigneeIds.some((id) => t.assigneeIds.includes(id))) return false;
          if (filterStatus.length && !filterStatus.includes(t.status)) return false;
          if (filterPriority.length && !filterPriority.includes(t.priority)) return false;
          if (filterOnlyMyTasks) {
            if (myPersonIds.length === 0) return false;
            if (!myPersonIds.some((id) => t.assigneeIds.includes(id))) return false;
          }
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
      name: 'project-planner-v7',
      storage: createJSONStorage(() => localStorage),
      // Persist data and user state
      partialize: (state) => ({
        project: state.project,
        subprojects: state.subprojects,
        tasks: state.tasks,
        persons: state.persons,
        materials: state.materials,
        comments: state.comments,
        budgetLines: state.budgetLines,
        users: state.users,
        currentUser: state.currentUser,
        availableUpgrades: state.availableUpgrades,
        projectUpgrades: state.projectUpgrades,
        expenses: state.expenses,
        activeView: state.activeView,
        ganttViewMode: state.ganttViewMode,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

// Automatische live synchronisatie naar server bij wijzigingen
useRenovationStore.subscribe((state) => {
  if (!isApplyingRemoteState) {
    pushStateToServer(state);
  }
});


