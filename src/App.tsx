import { lazy, Suspense } from 'react';
import { HashRouter, MemoryRouter, Route, Routes } from 'react-router-dom';

/** No modo "artifact" (página única embutida) a navegação fica em memória. */
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter;
import { DataProvider, useData } from './store/DataContext';
import { NowProvider } from './store/NowContext';
import { ToastProvider } from './store/ToastContext';
import { ThemeProvider } from './store/ThemeContext';
import { AcoesProvider } from './store/AcoesContext';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import LeadsListPage from './pages/LeadsListPage';

const LeadsKanbanPage = lazy(() => import('./pages/LeadsKanbanPage'));
const LeadDetailPage = lazy(() => import('./pages/LeadDetailPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function Carregando() {
  return (
    <div className="flex h-[60vh] items-center justify-center" role="status" aria-label="Carregando">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

function Rotas() {
  const { carregando } = useData();
  if (carregando) return <Carregando />;
  return (
    <Suspense fallback={<Carregando />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="leads" element={<LeadsListPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="funil" element={<LeadsKanbanPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NowProvider>
          <DataProvider>
            <Router>
              <AcoesProvider>
                <Rotas />
              </AcoesProvider>
            </Router>
          </DataProvider>
        </NowProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
