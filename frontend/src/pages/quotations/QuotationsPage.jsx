import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { quotationsAPI } from '@/services/api';
import Pagination from '@/components/Pagination';
import { ConfirmDialog } from '@/components/Modal';
import { formatDate, formatCurrency, getStatusLabel, downloadBlob } from '@/utils/helpers';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Download, Send,
         Copy, ArrowRightLeft, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['', 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];

export default function QuotationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotations, setQuotations] = useState([]);
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
      const res = await quotationsAPI.getAll({ page, per_page: 15, search, status });
      setQuotations(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load quotations'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const setAction = (id, val) => setActionLoading(a => ({ ...a, [id]: val }));

  const handleSend = async (id) => {
    setAction(id, 'sending');
    try {
      await quotationsAPI.send(id);
      toast.success('Quotation sent successfully');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setAction(id, null); }
  };

  const handleDuplicate = async (id) => {
    setAction(id, 'duplicating');
    try {
      const res = await quotationsAPI.duplicate(id);
      toast.success(`Duplicated as ${res.data.data.quote_number}`);
      load();
    } catch { toast.error('Failed to duplicate'); }
    finally { setAction(id, null); }
  };

  const handleConvert = async (id, qNumber) => {
    if (!window.confirm(`Convert ${qNumber} to invoice?`)) return;
    setAction(id, 'converting');
    try {
      const res = await quotationsAPI.convertToInvoice(id);
      toast.success(`Invoice ${res.data.data.invoice_number} created!`);
      navigate(`/invoices/${res.data.data.id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed'); }
    finally { setAction(id, null); }
  };

  const handleDownloadPdf = async (id, qNumber) => {
    setAction(id, 'pdf');
    try {
      const res = await quotationsAPI.getPdf(id);
      downloadBlob(res.data, `${qNumber}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to generate PDF'); }
    finally { setAction(id, null); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await quotationsAPI.delete(deleteId);
      toast.success('Quotation deleted');
      setDeleteId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  const applyFilters = () => setSearchParams({ search, status, page: 1 });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">{pagination?.total || 0} total quotations</p>
        </div>
        <Link to="/quotations/new" className="btn-primary"><Plus size={16} /> New Quotation</Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="search-bar flex-1 min-w-48">
          <Search size={15} className="icon" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Search quotes, clients..." className="form-input pl-9 w-full" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-36">
          {STATUSES.map(s => <option key={s} value={s}>{s ? getStatusLabel(s) : 'All Status'}</option>)}
        </select>
        <button onClick={applyFilters} className="btn-primary"><Filter size={15}/> Filter</button>
        <button onClick={() => { setSearch(''); setStatus(''); setSearchParams({ page: 1 }); load(); }} className="btn-secondary">
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner-lg" /></div>
        ) : quotations.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="text-gray-200 mb-3" />
            <h3 className="text-gray-500 font-medium">No quotations found</h3>
            <Link to="/quotations/new" className="btn-primary mt-4"><Plus size={16} /> New Quotation</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Valid Until</th>
                    <th>Reference</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q.id}>
                      <td>
                        <Link to={`/quotations/${q.id}`}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-700">
                          {q.quote_number}
                        </Link>
                      </td>
                      <td>
                        <div className="font-medium text-gray-800">{q.client?.client_name}</div>
                        {q.client?.company_name && <div className="text-xs text-gray-400">{q.client.company_name}</div>}
                      </td>
                      <td className="text-gray-500">{formatDate(q.quote_date)}</td>
                      <td className={`text-sm ${new Date(q.valid_until) < new Date() ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {formatDate(q.valid_until)}
                      </td>
                      <td className="text-gray-500 max-w-32 truncate">{q.reference || '—'}</td>
                      <td className="text-right font-bold text-gray-900">{formatCurrency(q.total)}</td>
                      <td><span className={`badge badge-${q.status}`}>{getStatusLabel(q.status)}</span></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/quotations/${q.id}`} className="btn-ghost btn-icon text-gray-400 hover:text-blue-600 h-7 w-7" title="View">
                            <Eye size={14} />
                          </Link>
                          {q.status !== 'converted' && (
                            <Link to={`/quotations/${q.id}/edit`} className="btn-ghost btn-icon text-gray-400 hover:text-yellow-600 h-7 w-7" title="Edit">
                              <Edit2 size={14} />
                            </Link>
                          )}
                          <button onClick={() => handleDownloadPdf(q.id, q.quote_number)} title="Download PDF"
                            disabled={actionLoading[q.id] === 'pdf'}
                            className="btn-ghost btn-icon text-gray-400 hover:text-green-600 h-7 w-7">
                            {actionLoading[q.id] === 'pdf' ? <span className="spinner w-3 h-3" /> : <Download size={14} />}
                          </button>
                          {q.status !== 'converted' && (
                            <button onClick={() => handleSend(q.id)} title="Send Email"
                              disabled={actionLoading[q.id] === 'sending'}
                              className="btn-ghost btn-icon text-gray-400 hover:text-blue-600 h-7 w-7">
                              {actionLoading[q.id] === 'sending' ? <span className="spinner w-3 h-3" /> : <Send size={14} />}
                            </button>
                          )}
                          <button onClick={() => handleDuplicate(q.id)} title="Duplicate"
                            disabled={actionLoading[q.id] === 'duplicating'}
                            className="btn-ghost btn-icon text-gray-400 hover:text-purple-600 h-7 w-7">
                            {actionLoading[q.id] === 'duplicating' ? <span className="spinner w-3 h-3" /> : <Copy size={14} />}
                          </button>
                          {(q.status === 'accepted' || q.status === 'sent') && (
                            <button onClick={() => handleConvert(q.id, q.quote_number)} title="Convert to Invoice"
                              disabled={actionLoading[q.id] === 'converting'}
                              className="btn-ghost btn-icon text-gray-400 hover:text-emerald-600 h-7 w-7">
                              {actionLoading[q.id] === 'converting' ? <span className="spinner w-3 h-3" /> : <ArrowRightLeft size={14} />}
                            </button>
                          )}
                          {q.status !== 'converted' && (
                            <button onClick={() => setDeleteId(q.id)}
                              className="btn-ghost btn-icon text-gray-400 hover:text-red-500 h-7 w-7" title="Delete">
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
              <Pagination pagination={pagination}
                onPageChange={p => setSearchParams({ search, status, page: p })} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Quotation" message="Are you sure? This cannot be undone." />
    </div>
  );
}
