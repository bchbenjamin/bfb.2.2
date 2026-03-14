import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthProvider } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import Spinner from './components/ui/Spinner.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import FilePage from './pages/FilePage.jsx';
import GrievanceDetailPage from './pages/GrievanceDetailPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import OfficerView from './pages/OfficerView.jsx';
import NotFound from './pages/NotFound.jsx';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-surface">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/file" element={<FilePage />} />
                <Route path="/grievance/:id" element={<GrievanceDetailPage />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute roles={['officer', 'admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/officer" element={
                  <ProtectedRoute roles={['officer', 'admin']}>
                    <OfficerView />
                  </ProtectedRoute>
                } />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Suspense>
  );
}
