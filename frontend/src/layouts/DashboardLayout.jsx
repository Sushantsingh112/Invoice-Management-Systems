import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Users, FileText, Receipt, CreditCard,
  BarChart3, Settings, ChevronDown, ChevronRight, LogOut,
  Menu, X, Bell, Search, Building2, Globe, Mail,
  Sliders, DollarSign, Calculator, FileCode
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/quotations', label: 'Quotations', icon: FileText },
  { path: '/invoices', label: 'Invoices', icon: Receipt },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

const SETTINGS_ITEMS = [
  { path: '/settings/general', label: 'General', icon: Sliders },
  { path: '/settings/business', label: 'Business', icon: Building2 },
  { path: '/settings/quotation', label: 'Quotation', icon: FileText },
  { path: '/settings/invoices', label: 'Invoices', icon: Receipt },
  { path: '/settings/payments', label: 'Payments', icon: DollarSign },
  { path: '/settings/tax', label: 'Tax', icon: Calculator },
  { path: '/settings/emails', label: 'Emails', icon: Mail },
  { path: '/settings/translation', label: 'Translation', icon: Globe },
];

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSettingsActive = location.pathname.startsWith('/settings');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        {(sidebarOpen || mobileSidebarOpen) && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">Invoice Pro</div>
            <div className="text-blue-300 text-xs">Management System</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
               ${isActive
                ? 'bg-blue-500/25 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/8'}`
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            {(sidebarOpen || mobileSidebarOpen) && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Settings expandable (admin only) */}
        {isAdmin && (
          <div>
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mt-1
                ${isSettingsActive ? 'bg-blue-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
            >
              <Settings size={18} className="flex-shrink-0" />
              {(sidebarOpen || mobileSidebarOpen) && (
                <>
                  <span className="flex-1 text-left">Settings</span>
                  {settingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </>
              )}
            </button>

            {settingsOpen && (sidebarOpen || mobileSidebarOpen) && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                {SETTINGS_ITEMS.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150
                       ${isActive ? 'bg-blue-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/8'}`
                    }
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${sidebarOpen || mobileSidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {(sidebarOpen || mobileSidebarOpen) && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.full_name}</div>
              <div className="text-slate-400 text-xs capitalize">{user?.role}</div>
            </div>
          )}
          {(sidebarOpen || mobileSidebarOpen) && (
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-slate-900 transition-all duration-300 flex-shrink-0
        ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          {/* Sidebar Toggle */}
          <button
            onClick={() => { setSidebarOpen(o => !o); setMobileSidebarOpen(o => !o); }}
            className="btn-ghost btn-icon text-gray-500"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="search-bar hidden sm:flex">
            <Search size={16} className="icon" />
            <input type="text" placeholder="Search invoices, clients..." className="form-input pl-9 w-64" />
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="btn-ghost btn-icon text-gray-500 relative">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-gray-800">{user?.full_name}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="btn-ghost btn-icon text-gray-400 hover:text-red-500">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
