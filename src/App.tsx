import React, { lazy, Suspense } from 'react';
import { useRenovationStore } from './store/useRenovationStore';
import { useSocket } from './hooks/useSocket';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TaskModal } from './components/TaskModal';
import { PersonsModal } from './components/PersonsModal';
import { GanttChart, LayoutGrid, List, Wallet } from 'lucide-react';
import type { ActiveView } from './types';

// Lazy-loaded views — elke view wordt een apart async chunk
// Initiële JS-payload daalt; browser laadt alleen de actieve view
const GanttView  = lazy(() => import('./views/GanttView').then(m => ({ default: m.GanttView })));
const KanbanView = lazy(() => import('./views/KanbanView').then(m => ({ default: m.KanbanView })));
const ListView   = lazy(() => import('./views/ListView').then(m => ({ default: m.ListView })));
const BudgetView = lazy(() => import('./views/BudgetView').then(m => ({ default: m.BudgetView })));

// Loading spinner voor Suspense-boundary
const ViewLoader = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);


const MOBILE_NAV: { id: ActiveView; label: string; icon: React.ElementType }[] = [
  { id: 'gantt',  label: 'Gantt',  icon: GanttChart },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'list',   label: 'Lijst',  icon: List },
  { id: 'budget', label: 'Budget', icon: Wallet },
];

function App() {
  const { activeView, setActiveView, isDarkMode } = useRenovationStore();
  useSocket();

  return (
    <div className={`flex h-dvh overflow-hidden ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>

      {/* Desktop sidebar (hidden on mobile via CSS) */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* View area — takes remaining height, above mobile nav */}
        <main className="flex-1 overflow-hidden pb-0 md:pb-0">
          <Suspense fallback={<ViewLoader />}>
            {activeView === 'gantt'  && <GanttView />}
            {activeView === 'kanban' && <KanbanView />}
            {activeView === 'list'   && <ListView />}
            {activeView === 'budget' && <BudgetView />}
          </Suspense>
        </main>

        {/* Mobile bottom navigation (hidden on desktop via CSS) */}
        <nav className="bottom-nav hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 safe-area-bottom">
          {MOBILE_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium
                transition-colors
                ${activeView === id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <Icon className={`w-5 h-5 ${activeView === id ? 'text-primary-500' : ''}`} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Task detail modal */}
      <TaskModal />

      {/* People management modal */}
      <PersonsModal />
    </div>
  );
}

export default App;
