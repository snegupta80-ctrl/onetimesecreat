import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateSecret from './pages/CreateSecret';
import ViewSecret from './pages/ViewSecret';
import CreateTeam from './pages/CreateTeam';
import TeamDashboard from './pages/TeamDashboard';


// ✅ Protected Route (SAFE VERSION)
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};


// ✅ All Routes
const AppRoutes = () => {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/view/:id" element={<ViewSecret />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateSecret />} />
          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/team-dashboard/:id" element={<TeamDashboard />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<h1 className="text-white text-center mt-20">404 Page Not Found</h1>} />

    </Routes>
  );
};


// 
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;