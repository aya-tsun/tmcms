import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MaterialListPage from './pages/MaterialListPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import MaterialFormPage from './pages/MaterialFormPage';
import ComparePage from './pages/ComparePage';
import TagManagePage from './pages/TagManagePage';
import UserManagePage from './pages/UserManagePage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/Toast';
import { useAuthStore } from './store/auth';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MaterialListPage /></ProtectedRoute>} />
        <Route path="/materials/new" element={<ProtectedRoute><MaterialFormPage /></ProtectedRoute>} />
        <Route path="/materials/:id" element={<ProtectedRoute><MaterialDetailPage /></ProtectedRoute>} />
        <Route path="/materials/:id/edit" element={<ProtectedRoute><MaterialFormPage /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><TagManagePage /></ProtectedRoute>} />
        <Route path="/users" element={<AdminRoute><UserManagePage /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
