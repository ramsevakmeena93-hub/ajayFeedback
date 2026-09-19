import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HowItWorks     from './pages/HowItWorks';
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Developer      from './pages/Developer';
import History        from './pages/History';
import HODDashboard   from './pages/HODDashboard';
import VCDashboard    from './pages/VCDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import ReportDetail   from './pages/ReportDetail';
import SubmissionDetail from './pages/SubmissionDetail';
import AdminDashboard from './pages/AdminDashboard';
import ProfileCompletion from './pages/ProfileCompletion';

const APP_ROLE = null;

// ─────────────────────────────────────────────────────────────────────────────
// Loading screen
// ─────────────────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0f1e]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"
          style={{ borderWidth: '3px' }} />
        <p className="text-slate-400 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — multi-role upgrade
//
// The `role` prop accepts a single role string (legacy) OR an array of roles.
//
// Access rules:
//  1. User must be authenticated.
//  2. User must hold at least one of the allowed roles (checked against
//     user.roles[], falling back to user.role for old tokens).
//  3. If `workspace` prop is supplied, the user's activeWorkspace must match
//     one of the allowed workspaces.
//
// The frontend check is a UX guard only. The backend enforces all access
// decisions independently on every request.
// ─────────────────────────────────────────────────────────────────────────────

function ProtectedRoute({ children, role, workspace }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;

  // Build the set of roles the user holds
  const userRoles = new Set([
    ...(user.roles || []),
    ...(user.role ? [user.role] : []),
  ]);

  // Normalise allowed roles to array
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    const hasRole = allowedRoles.some(r => userRoles.has(r));
    if (!hasRole) return <Navigate to="/login" replace />;
  }

  // Optional workspace check (UX guard — not a security boundary)
  if (workspace) {
    const allowedWS = Array.isArray(workspace) ? workspace : [workspace];
    const activeWS  = user.activeWorkspace || user.role;
    if (!allowedWS.includes(activeWS)) {
      // Multi-role user is on the wrong workspace — redirect them to the
      // workspace they're currently in rather than kicking to /login
      const dest = activeWS === 'hod'     ? '/hod'
                 : activeWS === 'vc'      ? '/vc'
                 : activeWS === 'faculty' ? '/faculty'
                 : activeWS === 'admin'   ? '/admin'
                 : '/dashboard';
      return <Navigate to={dest} replace />;
    }
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleRedirect — sends the user to their active workspace home
// ─────────────────────────────────────────────────────────────────────────────

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/landing" replace />;

  // New Google users who haven't set department/role yet
  if (user.needsDeptSetup) return <Navigate to="/profile-completion" replace />;

  // Use activeWorkspace (set by workspace switch) if available;
  // fall back to legacy role field for old sessions.
  const ws = user.activeWorkspace || user.role;
  const dest = ws === 'vc'      ? '/vc'
             : ws === 'faculty' ? '/faculty'
             : ws === 'admin'   ? '/admin'
             : '/hod';                    // default: HOD workspace
  return <Navigate to={dest} replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider appRole={APP_ROLE}>
      <Routes>
        {/* Public */}
        <Route path="/"                    element={<Navigate to="/landing" replace />} />
        <Route path="/landing"             element={<Landing />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/register"            element={<Register />} />
        <Route path="/profile-completion"  element={<ProfileCompletion />} />
        <Route path="/how-it-works"        element={<HowItWorks />} />
        <Route path="/developer"           element={<Developer />} />
        <Route path="/dashboard"           element={<RoleRedirect />} />

        {/* HOD workspace
            Role check: must hold 'hod' in their roles array.
            Workspace check: must be in 'hod' workspace.
            Multi-role users (e.g. HOD+Faculty) must switch to HOD workspace first. */}
        <Route path="/hod"
          element={
            <ProtectedRoute role="hod" workspace="hod">
              <HODDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/hod/report/:id"
          element={
            <ProtectedRoute role="hod" workspace="hod">
              <ReportDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/hod/history"
          element={
            <ProtectedRoute role="hod" workspace="hod">
              <History />
            </ProtectedRoute>
          }
        />

        {/* VC workspace */}
        <Route path="/vc"
          element={
            <ProtectedRoute role="vc" workspace="vc">
              <VCDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/vc/submission/:id"
          element={
            <ProtectedRoute role="vc" workspace="vc">
              <SubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/vc/history"
          element={
            <ProtectedRoute role="vc" workspace="vc">
              <History />
            </ProtectedRoute>
          }
        />

        {/* Faculty workspace
            Multi-role HOD+Faculty users can access this after switching workspace. */}
        <Route path="/faculty"
          element={
            <ProtectedRoute role={['faculty', 'hod']} workspace="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/faculty/history"
          element={
            <ProtectedRoute role={['faculty', 'hod']} workspace="faculty">
              <History />
            </ProtectedRoute>
          }
        />

        {/* Admin workspace */}
        <Route path="/admin"
          element={
            <ProtectedRoute role="admin" workspace="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </AuthProvider>
  );
}
