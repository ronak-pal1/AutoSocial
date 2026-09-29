import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { TwitterStudio } from './pages/TwitterStudio';
import { LinkedInStudio } from './pages/LinkedInStudio';
import { ImagesGallery } from './pages/ImagesGallery';
import { ResearchNotes } from './pages/ResearchNotes';
import { AnalyticsView } from './pages/AnalyticsView';
import { Connections } from './pages/Connections';
import { SettingsView } from './pages/SettingsView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000
    }
  }
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/twitter" element={<TwitterStudio />} />
              <Route path="/linkedin" element={<LinkedInStudio />} />
              <Route path="/images" element={<ImagesGallery />} />
              <Route path="/research" element={<ResearchNotes />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/settings" element={<SettingsView />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
