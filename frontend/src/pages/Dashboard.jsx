import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import {
  Users, FileText, Receipt, CheckCircle, Clock, AlertTriangle,
  TrendingUp, DollarSign, Calculator, ArrowUpRight, ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: '#94a3b8', sent: '#3b82f6', paid: '#10b981',
  partially_paid: '#f59e0b', overdue: '#ef4444', cancelled: '#9ca3af',
  accepted: '#10b981', rejected: '#ef4444', expired: '#f97316', converted: '#8b5cf6',
};

function StatCard({ label, value, icon: Icon, color, to, subtitle }) {
  const card = (
    <div className="stat-card group hover:shadow-md transition-all duration-200 cursor-pointer">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} className="opacity-80" />
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [invoiceStatus, setInvoiceStatus] = useState([]);
  const [quotationStatus, setQuotationStatus] = useState([]);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, revRes, invRes, quoRes, actRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getRevenue(),
        dashboardAPI.getInvoiceStatus(),
        dashboardAPI.getQuotationStatus(),
        dashboardAPI.getRecentActivity(),
      ]);
      setSummary(sumRes.data.data);
      setRevenue(revRes.data.data);
      setInvoiceStatus(invRes.data.data);
      setQuotationStatus(quoRes.data.data);
      setRecentActivity(actRes.data.data);

      // Try to get payment settings for currency formatting
      try {
        const { settingsAPI } = await import('@/services/api');
        const psRes = await settingsAPI.getPayment();
        setPaymentSettings(psRes.data.data);
      } catch {}
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const fmt = (v) => formatCurrency(v, paymentSettings);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner-lg" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your business performance</p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={summary?.total_clients || 0}
          icon={Users} color="bg-blue-50 text-blue-600" to="/clients" />
        <StatCard label="Total Quotations" value={summary?.total_quotations || 0}
          icon={FileText} color="bg-purple-50 text-purple-600" to="/quotations" />
        <StatCard label="Total Invoices" value={summary?.total_invoices || 0}
          icon={Receipt} color="bg-indigo-50 text-indigo-600" to="/invoices" />
        <StatCard label="Paid Invoices" value={summary?.paid_invoices || 0}
          icon={CheckCircle} color="bg-emerald-50 text-emerald-600"
          to="/invoices?status=paid" />
        <StatCard label="Pending Invoices" value={summary?.pending_invoices || 0}
          icon={Clock} color="bg-yellow-50 text-yellow-600"
          to="/invoices?status=sent" />
        <StatCard label="Overdue Invoices" value={summary?.overdue_invoices || 0}
          icon={AlertTriangle} color="bg-red-50 text-red-600"
          to="/invoices?status=overdue" />
        <StatCard label="Total Revenue" value={fmt(summary?.total_revenue || 0)}
          icon={TrendingUp} color="bg-green-50 text-green-600" />
        <StatCard label="Pending Amount" value={fmt(summary?.pending_amount || 0)}
          icon={DollarSign} color="bg-orange-50 text-orange-600" />
        <StatCard label="Tax Collected" value={fmt(summary?.tax_collected || 0)}
          icon={Calculator} color="bg-slate-50 text-slate-600" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Monthly Revenue</h3>
            <span className="text-xs text-gray-400">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month_short" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#revGrad)" dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Invoice Status</h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={invoiceStatus.filter(d => d.count > 0)}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="count" nameKey="status">
                  {invoiceStatus.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n.replace(/_/g, ' ')]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {invoiceStatus.filter(d => d.count > 0).map(d => (
                <div key={d.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[d.status] }} />
                    <span className="text-xs text-gray-600 capitalize">{d.status.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotation Status Bar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Quotation Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quotationStatus.filter(d => d.count > 0)} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={v => v.replace(/_/g, ' ')} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip formatter={(v, n) => [v, 'Count']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {quotationStatus.map((d) => (
                  <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Invoices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.recent_invoices?.length ? recentActivity.recent_invoices.map(inv => (
              <Link key={inv.id} to={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{inv.invoice_number}</div>
                  <div className="text-xs text-gray-400">{inv.client?.client_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{fmt(inv.total)}</div>
                  <span className={`badge badge-${inv.status}`}>{inv.status.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            )) : (
              <div className="empty-state py-8">
                <Receipt size={32} className="text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">No invoices yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
