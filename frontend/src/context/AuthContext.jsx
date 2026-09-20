import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD
    ? 'https://feedbackbackend-production-db19.up.railway.app'
    : 'http://localhost:5000');

// ─────────────────────────────────────────────────────────────────────────────
// AuthProvider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children, appRole }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket,  setSocket]  = useState(null);
  const socketRef = useRef(null);

  // ── Socket.IO ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }
    if (socketRef.current?.connected) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('[Socket] Connected:', s.id);
      setSocket(s);
    });
    s.on('disconnect', () => console.log('[Socket] Disconnected'));
    s.on('connect_error', err => console.warn('[Socket] Error:', err.message));

    socketRef.current = s;
    const ping = setInterval(() => { if (s.connected) s.emit('ping_activity'); }, 60000);

    return () => {
      clearInterval(ping);
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  // ── Hydration from localStorage / URL params ─────────────────────────────
  useEffect(() => {
    const storageKey = 'auth';

    // URL token (e.g. after Google OAuth redirect)
    const params   = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUser  = params.get('user');
    if (urlToken && urlUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        _setAuth(parsedUser, urlToken);
        localStorage.setItem(storageKey, JSON.stringify({ user: parsedUser, token: urlToken }));
        window.history.replaceState({}, '', window.location.pathname);
        // Refresh roles from server for URL-based auth too
        refreshRolesFromServer(urlToken);
        setLoading(false);
        return;
      } catch {}
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const { user: storedUser, token: storedToken } = JSON.parse(stored);
        // appRole isolation: skip if stored role doesn't match the expected appRole
        if (!appRole || storedUser.role === appRole ||
            (storedUser.roles && storedUser.roles.includes(appRole))) {
          _setAuth(storedUser, storedToken);
          // Always refresh roles from server on mount — picks up any
          // role changes made since the token was issued (e.g. admin
          // assigned a second role while the user was logged in).
          refreshRolesFromServer(storedToken);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, [appRole]); // eslint-disable-line

  /**
   * refreshRolesFromServer
   * the local user state + localStorage with the latest roles[] and
   * activeWorkspace from the database.
   * Never throws — failure is silent (user keeps their cached state).
   */
  async function refreshRolesFromServer(authToken) {
    if (!authToken) return;
    try {
      const res = await fetch(`${SOCKET_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const fresh = await res.json();
      if (!fresh?.email) return;

      const normalised = {
        id:              fresh._id || fresh.id,
        name:            fresh.name,
        email:           fresh.email,
        role:            fresh.role,
        roles:           fresh.roles || (fresh.role ? [fresh.role] : []),
        roleDetails:     fresh.roleDetails || [],
        activeWorkspace: fresh.activeWorkspace || fresh.role || 'hod',
        department:      fresh.department || '',
        hasSignature:    !!fresh.signatureImage,
        profilePhoto:    fresh.profilePhoto || '',
        defaultAlternateApproverId: fresh.defaultAlternateApproverId || null,
      };

      setUser(normalised);
      localStorage.setItem('auth', JSON.stringify({ user: normalised, token: authToken }));
    } catch {
      // Silently ignore — network failure, expired token, etc.
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal setter — normalises the user object before storing
  // ─────────────────────────────────────────────────────────────────────────

  function _setAuth(userData, authToken) {
    // Normalise: ensure roles[] is always an array even for old tokens
    const normalised = {
      ...userData,
      roles:           userData.roles || (userData.role ? [userData.role] : []),
      activeWorkspace: userData.activeWorkspace || userData.role || 'hod',
    };
    setUser(normalised);
    setToken(authToken);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  function login(arg1, arg2) {
    const userData  = typeof arg1 === 'object' && arg1 !== null ? arg1 : arg2;
    const authToken = typeof arg1 === 'string' ? arg1 : arg2;
    _setAuth(userData, authToken);
    localStorage.setItem('auth', JSON.stringify({ user: userData, token: authToken }));
  }
  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  }

  function updateUser(newUserData) {
    const normalised = {
      ...newUserData,
      roles:           newUserData.roles || (newUserData.role ? [newUserData.role] : []),
      activeWorkspace: newUserData.activeWorkspace || newUserData.role || 'hod',
    };
    setUser(normalised);
    localStorage.setItem('auth', JSON.stringify({ user: normalised, token }));
  }

  // ── Convenience getters (derived from user) ─────────────────────────────

  /** The current workspace the user is operating in. */
  const activeWorkspace = user?.activeWorkspace || user?.role || null;

  /** All role names this user holds (array). */
  const userRoles = (() => {
    const r = user?.roles ? [...user.roles] : (user?.role ? [user.role] : []);
    if (user?.role === 'hod' || r.includes('hod')) {
      if (!r.includes('hod')) r.push('hod');
      if (!r.includes('faculty')) r.push('faculty');
    }
    return [...new Set(r)];
  })();

  /** Returns true if the user holds at least one of the given roles. */
  function hasAnyRole(...roles) {
    return roles.some(r => userRoles.includes(r));
  }

  /** Returns true if the user's current workspace matches. */
  function inWorkspace(workspace) {
    return activeWorkspace === workspace;
  }

  /** Returns true if this user has multiple roles and can switch workspaces. */
  const isMultiRole = userRoles.length > 1;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      socket,
      loading,
      appRole,
      // Core auth actions
      login,
      logout,
      updateUser,
      // Multi-role conveniences
      activeWorkspace,
      userRoles,
      isMultiRole,
      hasAnyRole,
      inWorkspace,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
