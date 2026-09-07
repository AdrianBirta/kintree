import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MemberDetailPage from './pages/MemberDetailPage';
import MembersListPage from './pages/MembersListPage';
import ProfilePage from './pages/ProfilePage'; // NOU
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';

function App() {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-earbore-200 border-t-earbore-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersListPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} /> {/* NOU */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;