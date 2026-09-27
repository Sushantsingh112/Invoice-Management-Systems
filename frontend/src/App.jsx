import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import ClientsPage from '@/pages/clients/ClientsPage';
import ClientFormPage from '@/pages/clients/ClientFormPage';
import ClientDetailPage from '@/pages/clients/ClientDetailPage';
import QuotationsPage from '@/pages/quotations/QuotationsPage';
import QuotationFormPage from '@/pages/quotations/QuotationFormPage';
import QuotationDetailPage from '@/pages/quotations/QuotationDetailPage';
import InvoicesPage from '@/pages/invoices/InvoicesPage';
import InvoiceFormPage from '@/pages/invoices/InvoiceFormPage';
import InvoiceDetailPage from '@/pages/invoices/InvoiceDetailPage';
import PaymentsPage from '@/pages/PaymentsPage';
import ReportsPage from '@/pages/ReportsPage';
import GeneralSettingsPage from '@/pages/settings/GeneralSettingsPage';
import BusinessSettingsPage from '@/pages/settings/BusinessSettingsPage';
import QuotationSettingsPage from '@/pages/settings/QuotationSettingsPage';
import InvoiceSettingsPage from '@/pages/settings/InvoiceSettingsPage';
import PaymentSettingsPage from '@/pages/settings/PaymentSettingsPage';
import TaxSettingsPage from '@/pages/settings/TaxSettingsPage';
import EmailSettingsPage from '@/pages/settings/EmailSettingsPage';
import TranslationSettingsPage from '@/pages/settings/TranslationSettingsPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="spinner-lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<LandingPage />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Clients */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<ClientFormPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />

        {/* Quotations */}
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/quotations/new" element={<QuotationFormPage />} />
        <Route path="/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/quotations/:id/edit" element={<QuotationFormPage />} />

        {/* Invoices */}
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<InvoiceFormPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />

        {/* Payments & Reports */}
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Settings */}
        <Route path="/settings/general" element={<ProtectedRoute adminOnly><GeneralSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/business" element={<ProtectedRoute adminOnly><BusinessSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/quotation" element={<ProtectedRoute adminOnly><QuotationSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/invoices" element={<ProtectedRoute adminOnly><InvoiceSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/payments" element={<ProtectedRoute adminOnly><PaymentSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/tax" element={<ProtectedRoute adminOnly><TaxSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/emails" element={<ProtectedRoute adminOnly><EmailSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/translation" element={<ProtectedRoute adminOnly><TranslationSettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
