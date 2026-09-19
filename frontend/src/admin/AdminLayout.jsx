import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, BarChart3, Users, GraduationCap, UserCog, 
  Crown, Building2, Shield, MessageSquare, FileText, PenTool, 
  Bell, ClipboardList, Settings, Menu, Search, Moon, Sun, 
  ChevronDown, ChevronRight, LogOut, Activity
} from 'lucide-react';

import DashboardOverview from './sections/DashboardOverview';
import Analytics from './sections/Analytics';
import UserManagement from './sections/UserManagement';
import GoogleAuthUsers from './sections/GoogleAuthUsers';
import FacultyManagement from './sections/FacultyManagement';
import HODManagement from './sections/HODManagement';
import VCManagement from './sections/VCManagement';
import DepartmentManagement from './sections/DepartmentManagement';
import RolePermissions from './sections/RolePermissions';
import FeedbackManagement from './sections/FeedbackManagement';
import Reports from './sections/Reports';
import DigitalSignatures from './sections/DigitalSignatures';
import NotificationsSection from './sections/NotificationsSection';
import AuditLogs from './sections/AuditLogs';
import SettingsSection from './sections/SettingsSection';
import LiveAnalytics from './sections/LiveAnalytics';

export default function AdminLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('admin_dark_mode') === 'true';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hodMenuOpen, setHodMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('admin_dark_mode', isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = () => {
    if (logout) logout();
    navigate('/landing');
    toast.success('Logged out successfully');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'live_analytics', icon: Activity, label: 'Live Analytics' },
    { id: 'users', icon: Users, label: 'User Management' },
    { id: 'google_users', icon: LogOut, label: 'Google OAuth Users' },
    { id: 'faculty', icon: GraduationCap, label: 'Faculty Management' },
  ];
  
  const hodSubItems = [
    { id: 'hod_all', label: 'All HODs' },
    { id: 'hod_assign', label: 'Assign HOD' },
  ];

  const menuItems2 = [
    { id: 'vc', icon: Crown, label: 'VC Management' },
    { id: 'departments', icon: Building2, label: 'Departments' },
    { id: 'roles', icon: Shield, label: 'Roles & Permissions' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback & Reports' },
    { id: 'signatures', icon: PenTool, label: 'Digital Signatures' },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: notificationCount },
    { id: 'audit', icon: ClipboardList, label: 'Audit Logs' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderSection = () => {
    const props = { token, user, isDark };
    switch (activeSection) {
      case 'dashboard': return <DashboardOverview {...props} />;
      case 'analytics': return <Analytics {...props} />;
      case 'live_analytics': return <LiveAnalytics token={token} isDark={isDark} />;
      case 'users': return <UserManagement {...props} />;
      case 'google_users': return <GoogleAuthUsers {...props} />;
      case 'faculty': return <FacultyManagement {...props} />;
      case 'hod': 
      case 'hod_all':
      case 'hod_assign':
        return <HODManagement {...props} />;
      case 'vc': return <VCManagement {...props} />;
      case 'departments': return <DepartmentManagement {...props} />;
      case 'roles': return <RolePermissions {...props} />;
      case 'feedback': return <FeedbackManagement {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'signatures': return <DigitalSignatures {...props} />;
      case 'notifications': return <NotificationsSection {...props} onCountChange={setNotificationCount} />;
      case 'audit': return <AuditLogs {...props} />;
      case 'settings': return <SettingsSection {...props} />;
      default: return <DashboardOverview {...props} />;
    }
  };

  const SidebarItem = ({ id, icon: Icon, label, badge, isSubItem = false }) => {
    const isActive = activeSection === id;
    return (
      <button
        onClick={() => setActiveSection(id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 my-0.5 rounded-xl transition-all duration-200 group text-xs font-semibold
          ${isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
          ${isSubItem ? 'pl-9' : ''}
        `}
        title={sidebarCollapsed ? label : ''}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && <Icon size={18} className="shrink-0" />}
          {!sidebarCollapsed && <span className="truncate">{label}</span>}
        </div>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-1.5">
            {badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                {badge}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={`min-h-screen flex font-sans ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside 
        className={`flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base leading-tight truncate">Admin Console</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">MITS Feedback</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 scrollbar-hide space-y-0.5">
          {menuItems.map(item => (
            <SidebarItem key={item.id} {...item} />
          ))}
          
          {/* HOD Menu */}
          <SidebarItem id="hod" icon={UserCog} label="HOD Management" />

          {menuItems2.map(item => (
            <SidebarItem key={item.id} {...item} />
          ))}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate">{user?.name || 'Administrator'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@mits.ac.in'}</div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Sign Out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Global Search (Users, Departments, Signatures, Reports)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => setActiveSection('notifications')}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
