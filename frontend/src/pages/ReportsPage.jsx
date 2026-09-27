import { useState } from 'react';
import { reportsAPI } from '@/services/api';
import { formatCurrency, formatDate, today, downloadBlob } from '@/utils/helpers';
import { BarChart3, TrendingUp, CreditCard, AlertTriangle, FileText, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'sales', label: 'Sales Report', icon: TrendingUp },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'outstanding', label: 'Outstanding', icon: AlertTriangle },
  { key: 'quotations', label: 'Quotations', icon: FileText },
  { key: 'tax', label: 'Tax Report', icon: BarChart3 },
];

const thisYear = new Date().getFullYear();
const DEFAULT_FROM = `${thisYear}-01-01`;
const DEFAULT_TO = today();

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState(DEFAULT_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_TO);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let res;
      const params = { date_from: dateFrom, date_to: dateTo };
      if (tab === 'sales') res = await reportsAPI.getSales(params);
      else if (tab === 'payments') res = await reportsAPI.getPayments(params);
      else if (tab === 'outstanding') res = await reportsAPI.getOutstanding();
      else if (tab === 'quotations') res = await reportsAPI.getQuotations(params);
      else if (tab === 'tax') res = await reportsAPI.getTax(params);
      setData(res.data.data);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const res = await reportsAPI.exportInvoices({ date_from: dateFrom, date_to: dateTo });
      downloadBlob(res.data, `invoices_${dateFrom}_${dateTo}.csv`);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
    finally { setExportLoading(false); }
  };

  const SummaryCard = ({ label, value, color = 'text-gray-900' }) => (
    <div className="card p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-subtitle">Business performance analytics</p></div>
        <button onClick={handleExportCSV} disabled={exportLoading} className="btn-secondary">
          {exportLoading ? <span className="spinner"/> : <Download size={15}/>} Export CSV
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="card p-1 flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setData(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Date Filter (not for outstanding) */}
      {tab !== 'outstanding' && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Period:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input w-36" />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input w-36" />
          <button onClick={load} className="btn-primary"><Filter size={15}/> Generate</button>
        </div>
      )}
      {tab === 'outstanding' && (
        <div className="card p-4 flex items-center gap-3">
          <span className="text-sm text-gray-600">Shows all outstanding balances as of today</span>
          <button onClick={load} className="btn-primary"><Filter size={15}/> Load</button>
        </div>
      )}

      {/* Report Data */}
      {loading && <div className="flex items-center justify-center h-48"><div className="spinner-lg"/></div>}

      {!loading && data && (
        <div className="space-y-5">
          {/* Sales Report */}
          {tab === 'sales' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Invoiced" value={formatCurrency(data.summary?.total)} />
                <SummaryCard label="Total Collected" value={formatCurrency(data.summary?.paid)} color="text-green-600" />
                <SummaryCard label="Pending" value={formatCurrency(data.summary?.pending)} color="text-red-500" />
                <SummaryCard label="Tax Collected" value={formatCurrency(data.summary?.tax_collected)} color="text-blue-600" />
              </div>
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">Invoice Details ({data.summary?.count})</div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Due</th>
                      <th className="text-right">Total</th><th className="text-right">Paid</th>
                      <th className="text-right">Balance</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.invoices?.map(inv => (
                        <tr key={inv.id}>
                          <td className="font-mono text-blue-600">{inv.invoice_number}</td>
                          <td>{inv.client?.client_name}</td>
                          <td className="text-gray-500">{formatDate(inv.invoice_date)}</td>
                          <td className="text-gray-500">{formatDate(inv.due_date)}</td>
                          <td className="text-right font-semibold">{formatCurrency(inv.total)}</td>
                          <td className="text-right text-green-600">{formatCurrency(inv.paid_amount)}</td>
                          <td className="text-right text-red-500">{formatCurrency(inv.balance_due)}</td>
                          <td><span className={`badge badge-${inv.status}`}>{inv.status.replace(/_/g,' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Payments Report */}
          {tab === 'payments' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <SummaryCard label="Total Collected" value={formatCurrency(data.summary?.total)} color="text-green-600" />
                <SummaryCard label="Total Payments" value={data.summary?.count} />
              </div>
              <div className="card p-4">
                <h3 className="font-semibold text-gray-800 mb-3">By Payment Method</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(data.summary?.by_method || {}).map(([m, v]) => (
                    <div key={m} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 capitalize mb-1">{m.replace(/_/g,' ')}</div>
                      <div className="font-bold text-gray-800">{formatCurrency(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Invoice #</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>
                    {data.payments?.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.payment_date)}</td>
                        <td className="font-mono text-blue-600">{p.invoice?.invoice_number}</td>
                        <td className="capitalize">{p.payment_method?.replace(/_/g,' ')}</td>
                        <td className="font-mono text-xs text-gray-500">{p.transaction_id || '—'}</td>
                        <td className="text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Outstanding */}
          {tab === 'outstanding' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Overdue Count" value={data.summary?.overdue_count} color="text-red-600" />
                <SummaryCard label="Overdue Amount" value={formatCurrency(data.summary?.overdue_amount)} color="text-red-600" />
                <SummaryCard label="Upcoming Count" value={data.summary?.upcoming_count} color="text-yellow-600" />
                <SummaryCard label="Upcoming Amount" value={formatCurrency(data.summary?.upcoming_amount)} color="text-yellow-600" />
              </div>
              {data.overdue?.length > 0 && (
                <div className="card overflow-hidden border-red-100">
                  <div className="p-4 border-b border-red-100 flex items-center gap-2 font-semibold text-red-700 bg-red-50">
                    <AlertTriangle size={16}/> Overdue ({data.overdue.length})
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Due Date</th><th className="text-right">Balance Due</th></tr></thead>
                    <tbody>
                      {data.overdue?.map(inv => (
                        <tr key={inv.id} className="bg-red-50/30">
                          <td className="font-mono text-red-600">{inv.invoice_number}</td>
                          <td>{inv.client?.client_name}</td>
                          <td className="text-red-600 font-medium">{formatDate(inv.due_date)}</td>
                          <td className="text-right font-bold text-red-600">{formatCurrency(inv.balance_due)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {data.upcoming?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">Upcoming ({data.upcoming.length})</div>
                  <table className="data-table">
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Due Date</th><th className="text-right">Balance Due</th></tr></thead>
                    <tbody>
                      {data.upcoming?.map(inv => (
                        <tr key={inv.id}>
                          <td className="font-mono text-blue-600">{inv.invoice_number}</td>
                          <td>{inv.client?.client_name}</td>
                          <td className="text-gray-600">{formatDate(inv.due_date)}</td>
                          <td className="text-right font-bold text-yellow-600">{formatCurrency(inv.balance_due)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Quotations */}
          {tab === 'quotations' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Quotations" value={data.summary?.count} />
                <SummaryCard label="Total Value" value={formatCurrency(data.summary?.total_value)} color="text-blue-600" />
                {Object.entries(data.summary?.by_status || {}).slice(0,1).map(([s,c]) =>
                  <SummaryCard key={s} label={`${s} Quotes`} value={c} />)}
              </div>
              <div className="card overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>Quote #</th><th>Client</th><th>Date</th><th>Valid Until</th><th className="text-right">Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.quotations?.map(q => (
                      <tr key={q.id}>
                        <td className="font-mono text-purple-600">{q.quote_number}</td>
                        <td>{q.client?.client_name}</td>
                        <td className="text-gray-500">{formatDate(q.quote_date)}</td>
                        <td className="text-gray-500">{formatDate(q.valid_until)}</td>
                        <td className="text-right font-semibold">{formatCurrency(q.total)}</td>
                        <td><span className={`badge badge-${q.status}`}>{q.status.replace(/_/g,' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tax Report */}
          {tab === 'tax' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Invoices" value={data.summary?.total_invoices} />
                <SummaryCard label="Tax Billed" value={formatCurrency(data.summary?.total_tax_billed)} color="text-blue-600" />
                <SummaryCard label="Tax Collected" value={formatCurrency(data.summary?.tax_collected)} color="text-green-600" />
                <SummaryCard label="Tax Pending" value={formatCurrency(data.summary?.tax_pending)} color="text-red-500" />
              </div>
              <div className="card overflow-hidden">
                <table className="data-table">
                  <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th>
                    <th className="text-right">Subtotal</th><th className="text-right">Tax</th>
                    <th className="text-right">Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.invoices?.map((inv, i) => (
                      <tr key={i}>
                        <td className="font-mono text-blue-600">{inv.invoice_number}</td>
                        <td>{inv.client}</td>
                        <td className="text-gray-500">{formatDate(inv.date)}</td>
                        <td className="text-right">{formatCurrency(inv.subtotal)}</td>
                        <td className="text-right text-emerald-600 font-medium">{formatCurrency(inv.tax)}</td>
                        <td className="text-right font-semibold">{formatCurrency(inv.total)}</td>
                        <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !data && (
        <div className="card">
          <div className="empty-state py-16">
            <BarChart3 size={48} className="text-gray-200 mb-3" />
            <h3 className="text-gray-500 font-medium">Generate a Report</h3>
            <p className="text-gray-400 text-sm mt-1">Select a report type and click Generate</p>
          </div>
        </div>
      )}
    </div>
  );
}
