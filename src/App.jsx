import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import StudySession from './pages/StudySession';
import WordConsole from './pages/WordConsole';
import GoalsPage from './pages/GoalsPage';
import CourseManager from './pages/CourseManager';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminContent from './pages/admin/AdminContent';
import AdminMonitoring from './pages/admin/AdminMonitoring';
import AdminDatabase from './pages/admin/AdminDatabase';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import AdminSystem from './pages/admin/AdminSystem';


const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const ManagerRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Allow both MANAGER and ADMIN roles
  return user && (user.role === 'MANAGER' || user.role === 'ADMIN') ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
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
                <Route path="goals" element={<GoalsPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="settings" element={<SettingsPage />} />

                <Route element={<ManagerRoute />}>
                  <Route path="manager" element={<CourseManager />} />
                </Route>
              </Route>

              {/* Admin Section - Completely Separate Layout */}
              <Route element={<ManagerRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="monitoring" element={<AdminMonitoring />} />
                  <Route path="database" element={<AdminDatabase />} />
                  <Route path="maintenance" element={<AdminMaintenance />} />
                  <Route path="system" element={<AdminSystem />} />
                </Route>
              </Route>



              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;


