import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Lazy load pages for code splitting - reduces initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CourseList = lazy(() => import('./pages/CourseList'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const StudySession = lazy(() => import('./pages/StudySession'));
const WordConsole = lazy(() => import('./pages/WordConsole'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ManagementPage = lazy(() => import('./pages/ManagementPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const AdminMonitoring = lazy(() => import('./pages/admin/AdminMonitoring'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ADMIN');
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route element={<ProtectedRoute />}>
                  {/* Main App Layout */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="courses" element={<CourseList />} />
                    <Route path="courses/:courseId" element={<CourseDetail />} />
                    <Route path="study/:topicId" element={<StudySession />} />
                    <Route path="study" element={<Navigate to="/courses" replace />} />
                    <Route path="console" element={<WordConsole />} />
                    <Route path="management" element={<ManagementPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Admin routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<Layout />}>
                      <Route path="monitoring" element={<AdminMonitoring />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;
