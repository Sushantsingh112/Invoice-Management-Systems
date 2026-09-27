import { useState, useEffect, useCallback } from 'react';
import { paymentsAPI } from '@/services/api';
import Pagination from '@/components/Pagination';
import { ConfirmDialog } from '@/components/Modal';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { CreditCard, Search, Filter, RefreshCw, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const METHODS = ['', 'cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other'];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.getAll({ page, per_page: 15, payment_method: method, date_from: dateFrom, date_to: dateTo });
      setPayments(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [page, method, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await paymentsAPI.delete(deleteId);
      toast.success('Payment deleted and invoice balance updated');
      setDeleteId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const totalAmount = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{pagination?.total || 0} total payments</p>
        </div>
      </div>

      {/* Summary Card */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <div><p className="stat-label">Payments on This Page</p><p className="stat-value">{payments.length}</p></div>
            <div className="stat-icon bg-emerald-50 text-emerald-600"><CreditCard size={22} /></div>
          </div>
          <div className="stat-card col-span-2">
            <div><p className="stat-label">Page Total</p><p className="stat-value">{formatCurrency(totalAmount)}</p></div>
            <div className="stat-icon bg-blue-50 text-blue-600"><CreditCard size={22} /></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select value={method} onChange={e => setMethod(e.target.value)} className="form-select w-40">
          {METHODS.map(m => <option key={m} value={m}>{m ? m.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'All Methods'}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input w-36" />
          <span className="text-sm text-gray-500">To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input w-36" />
        </div>
        <button onClick={() => { setPage(1); load(); }} className="btn-primary"><Filter size={15}/> Filter</button>
        <button onClick={() => { setMethod(''); setDateFrom(''); setDateTo(''); setPage(1); }} className="btn-secondary">
          <RefreshCw size={14}/> Reset
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner-lg" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} className="text-gray-200 mb-3" />
            <h3 className="text-gray-500 font-medium">No payments recorded</h3>
            <p className="text-gray-400 text-sm">Record payments from the Invoice detail page</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment Date</th><th>Invoice #</th><th>Client</th>
                    <th>Method</th><th>Transaction ID</th>
                    <th className="text-right">Amount</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{formatDate(p.payment_date)}</td>
                      <td>
                        {p.invoice_id ? (
                          <Link to={`/invoices/${p.invoice_id}`} className="font-mono text-blue-600 hover:text-blue-700">
                            {p.invoice?.invoice_number || `#${p.invoice_id}`}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="text-gray-700">{p.invoice?.client?.client_name || '—'}</td>
                      <td>
                        <span className="badge bg-gray-100 text-gray-700 capitalize">
                          {p.payment_method?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-gray-500">{p.transaction_id || '—'}</td>
                      <td className="text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {p.invoice_id && (
                            <Link to={`/invoices/${p.invoice_id}`}
                              className="btn-ghost btn-icon text-gray-400 hover:text-blue-600 h-7 w-7"><Eye size={14}/></Link>
                          )}
                          <button onClick={() => setDeleteId(p.id)}
                            className="btn-ghost btn-icon text-gray-400 hover:text-red-500 h-7 w-7">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Payment"
        message="Deleting this payment will update the invoice balance. This cannot be undone." />
    </div>
  );
}
