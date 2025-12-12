import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import StudySession from './pages/StudySession';
import WordConsole from './pages/WordConsole';
import SettingsPage from './pages/SettingsPage';
import ManagementPage from './pages/ManagementPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';


const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
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
                <Route path="management" element={<ManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
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


