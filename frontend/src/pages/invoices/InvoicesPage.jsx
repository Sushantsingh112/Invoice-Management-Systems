import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { invoicesAPI } from '@/services/api';
import Pagination from '@/components/Pagination';
import { ConfirmDialog } from '@/components/Modal';
import { formatDate, formatCurrency, getStatusLabel, downloadBlob } from '@/utils/helpers';
import { Plus, Search, Edit2, Trash2, Eye, Receipt, Download, Send,
         Copy, CreditCard, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['','draft','sent','partially_paid','paid','overdue','cancelled'];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const page = parseInt(searchParams.get('page') || '1');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesAPI.getAll({ page, per_page: 15, search, status });
      setInvoices(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const setAction = (id, v) => setActionLoading(a => ({ ...a, [id]: v }));

  const handleSend = async (id) => {
    setAction(id, 'sending');
    try {
      await invoicesAPI.send(id);
      toast.success('Invoice sent via email');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Send failed'); }
    finally { setAction(id, null); }
  };

  const handleDuplicate = async (id) => {
    setAction(id, 'dup');
    try {
      const res = await invoicesAPI.duplicate(id);
      toast.success(`Duplicated as ${res.data.data.invoice_number}`);
      load();
    } catch { toast.error('Duplication failed'); }
    finally { setAction(id, null); }
  };

  const handlePdf = async (id, invNumber) => {
    setAction(id, 'pdf');
    try {
      const res = await invoicesAPI.getPdf(id);
      downloadBlob(res.data, `${invNumber}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF generation failed'); }
    finally { setAction(id, null); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await invoicesAPI.delete(deleteId);
      toast.success('Invoice deleted');
      setDeleteId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const applyFilters = () => setSearchParams({ search, status, page: 1 });

  const isOverdue = (inv) => inv.status !== 'paid' && inv.status !== 'cancelled' && new Date(inv.due_date) < new Date();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{pagination?.total || 0} total invoices</p>
        </div>
        <Link to="/invoices/new" className="btn-primary"><Plus size={16} /> New Invoice</Link>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="search-bar flex-1 min-w-48">
          <Search size={15} className="icon" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Search invoices, clients..." className="form-input pl-9 w-full" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-40">
          {STATUSES.map(s => <option key={s} value={s}>{s ? getStatusLabel(s) : 'All Status'}</option>)}
        </select>
        <button onClick={applyFilters} className="btn-primary"><Filter size={15} /> Filter</button>
        <button onClick={() => { setSearch(''); setStatus(''); setSearchParams({ page: 1 }); }} className="btn-secondary">
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner-lg" /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <Receipt size={48} className="text-gray-200 mb-3" />
            <h3 className="text-gray-500 font-medium">No invoices found</h3>
            <Link to="/invoices/new" className="btn-primary mt-4"><Plus size={16} /> New Invoice</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th><th>Client</th><th>Date</th><th>Due Date</th>
                    <th className="text-right">Total</th><th className="text-right">Balance</th>
                    <th>Status</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className={isOverdue(inv) ? 'bg-red-50/30' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          {isOverdue(inv) && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                          <Link to={`/invoices/${inv.id}`}
                            className="font-mono font-semibold text-blue-600 hover:text-blue-700">
                            {inv.invoice_number}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-gray-800">{inv.client?.client_name}</div>
                        {inv.client?.company_name && <div className="text-xs text-gray-400">{inv.client.company_name}</div>}
                      </td>
                      <td className="text-gray-500">{formatDate(inv.invoice_date)}</td>
                      <td className={`text-sm ${isOverdue(inv) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="text-right font-bold text-gray-900">{formatCurrency(inv.total)}</td>
                      <td className={`text-right font-semibold ${parseFloat(inv.balance_due) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(inv.balance_due)}
                      </td>
                      <td><span className={`badge badge-${inv.status}`}>{getStatusLabel(inv.status)}</span></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/invoices/${inv.id}`} className="btn-ghost btn-icon text-gray-400 hover:text-blue-600 h-7 w-7"><Eye size={14} /></Link>
                          {inv.status !== 'paid' && <Link to={`/invoices/${inv.id}/edit`} className="btn-ghost btn-icon text-gray-400 hover:text-yellow-600 h-7 w-7"><Edit2 size={14} /></Link>}
                          <button onClick={() => handlePdf(inv.id, inv.invoice_number)} disabled={actionLoading[inv.id]==='pdf'} className="btn-ghost btn-icon text-gray-400 hover:text-green-600 h-7 w-7">
                            {actionLoading[inv.id]==='pdf' ? <span className="spinner w-3 h-3"/> : <Download size={14}/>}
                          </button>
                          <button onClick={() => handleSend(inv.id)} disabled={actionLoading[inv.id]==='sending'} className="btn-ghost btn-icon text-gray-400 hover:text-blue-600 h-7 w-7">
                            {actionLoading[inv.id]==='sending' ? <span className="spinner w-3 h-3"/> : <Send size={14}/>}
                          </button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <Link to={`/invoices/${inv.id}`} className="btn-ghost btn-icon text-gray-400 hover:text-emerald-600 h-7 w-7" title="Record Payment">
                              <CreditCard size={14} />
                            </Link>
                          )}
                          <button onClick={() => handleDuplicate(inv.id)} disabled={actionLoading[inv.id]==='dup'} className="btn-ghost btn-icon text-gray-400 hover:text-purple-600 h-7 w-7">
                            {actionLoading[inv.id]==='dup' ? <span className="spinner w-3 h-3"/> : <Copy size={14}/>}
                          </button>
                          {inv.status !== 'paid' && (
                            <button onClick={() => setDeleteId(inv.id)} className="btn-ghost btn-icon text-gray-400 hover:text-red-500 h-7 w-7">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination pagination={pagination} onPageChange={p => setSearchParams({ search, status, page: p })} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Invoice" message="Are you sure? This cannot be undone." />
    </div>
  );
}
