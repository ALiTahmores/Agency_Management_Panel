import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { StyledEngineProvider } from '@mui/material/styles';
import theme from './theme';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/auth/AuthPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import TasksPage from './pages/tasks/TasksPage';
import TeamsPage from './pages/teams/TeamsPage';
import ModulesPage from './pages/modules/ModulesPage';
import ModuleDetailPage from './pages/modules/ModuleDetailPage';
import FilesPage from './pages/files/FilesPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <AppProvider>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/modules" element={<ModulesPage />} />
                    <Route path="/modules/:slug" element={<ModuleDetailPage />} />
                    <Route path="/files" element={<FilesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
