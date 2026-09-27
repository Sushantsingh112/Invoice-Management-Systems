import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quotationsAPI } from '@/services/api';
import { formatDate, formatCurrency, getStatusLabel, downloadBlob } from '@/utils/helpers';
import { ArrowLeft, Edit2, Download, Send, Copy, ArrowRightLeft,
         CheckCircle, XCircle, Clock, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700', converted: 'bg-purple-100 text-purple-700',
};

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    quotationsAPI.getById(id)
      .then(res => setQuotation(res.data.data))
      .catch(() => { toast.error('Quotation not found'); navigate('/quotations'); })
      .finally(() => setLoading(false));
  }, [id]);

  const setAction = (val) => setActionLoading(val);

  const handleSend = async () => {
    setAction('sending');
    try {
      await quotationsAPI.send(id);
      toast.success('Quotation sent successfully');
      const res = await quotationsAPI.getById(id);
      setQuotation(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Send failed'); }
    finally { setAction(''); }
  };

  const handlePdf = async () => {
    setAction('pdf');
    try {
      const res = await quotationsAPI.getPdf(id);
      downloadBlob(res.data, `${quotation.quote_number}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF generation failed'); }
    finally { setAction(''); }
  };

  const handleConvert = async () => {
    if (!window.confirm('Convert this quotation to an invoice?')) return;
    setAction('converting');
    try {
      const res = await quotationsAPI.convertToInvoice(id);
      toast.success(`Invoice ${res.data.data.invoice_number} created!`);
      navigate(`/invoices/${res.data.data.id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed'); }
    finally { setAction(''); }
  };

  const handleStatusChange = async (newStatus) => {
    setAction('status');
    try {
      await quotationsAPI.updateStatus(id, newStatus);
      const res = await quotationsAPI.getById(id);
      setQuotation(res.data.data);
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error('Status update failed'); }
    finally { setAction(''); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner-lg" /></div>;
  if (!quotation) return null;

  const q = quotation;
  const client = q.client;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/quotations')} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{q.quote_number}</h1>
              <span className={`badge ${STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-600'}`}>
                {getStatusLabel(q.status)}
              </span>
            </div>
            <p className="page-subtitle">{client?.client_name} · {formatDate(q.quote_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {q.status !== 'converted' && (
            <Link to={`/quotations/${id}/edit`} className="btn-secondary btn-sm"><Edit2 size={14} /> Edit</Link>
          )}
          <button onClick={handlePdf} disabled={actionLoading === 'pdf'} className="btn-secondary btn-sm">
            {actionLoading === 'pdf' ? <span className="spinner" /> : <Download size={14} />} PDF
          </button>
          {q.status !== 'converted' && (
            <button onClick={handleSend} disabled={actionLoading === 'sending'} className="btn-primary btn-sm">
              {actionLoading === 'sending' ? <span className="spinner" /> : <Send size={14} />} Send
            </button>
          )}
          {(q.status === 'accepted' || q.status === 'sent') && (
            <button onClick={handleConvert} disabled={actionLoading === 'converting'} className="btn-success btn-sm">
              {actionLoading === 'converting' ? <span className="spinner" /> : <ArrowRightLeft size={14} />} Convert to Invoice
            </button>
          )}
        </div>
      </div>

      {/* Status Actions */}
      {q.status === 'sent' && (
        <div className="card p-4 flex items-center gap-3 bg-blue-50 border-blue-100">
          <Clock size={16} className="text-blue-500" />
          <span className="text-sm text-blue-700 flex-1">This quotation has been sent. Update status based on client response:</span>
          <button onClick={() => handleStatusChange('accepted')} className="btn-success btn-sm">
            <CheckCircle size={13} /> Accept
          </button>
          <button onClick={() => handleStatusChange('rejected')} className="btn-danger btn-sm">
            <XCircle size={13} /> Reject
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Dates */}
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">From</p>
                <p className="font-semibold text-gray-800">Your Company</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bill To</p>
                <p className="font-semibold text-gray-800">{client?.client_name}</p>
                {client?.company_name && <p className="text-sm text-gray-500">{client.company_name}</p>}
                {client?.email && <p className="text-sm text-blue-600">{client.email}</p>}
                {client?.address && <p className="text-sm text-gray-500">{client.address}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Quote Date</p>
                <p className="font-medium text-gray-700">{formatDate(q.quote_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Valid Until</p>
                <p className={`font-medium ${new Date(q.valid_until) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatDate(q.valid_until)}
                </p>
              </div>
              {q.reference && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reference</p>
                  <p className="text-gray-700">{q.reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Line Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th><th className="text-center">Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Disc</th>
                    <th className="text-right">Tax</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items?.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div className="font-medium text-gray-800">{item.item_name}</div>
                        {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                      </td>
                      <td className="text-center text-gray-600">{item.quantity}</td>
                      <td className="text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right text-red-500">{item.discount_percentage > 0 ? `${item.discount_percentage}%` : '—'}</td>
                      <td className="text-right text-emerald-600">{item.tax_percentage > 0 ? `${item.tax_percentage}%` : '—'}</td>
                      <td className="text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Terms */}
          {(q.notes || q.terms) && (
            <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.notes && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{q.notes}</p>
                </div>
              )}
              {q.terms && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{q.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Totals */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Summary</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span className="font-medium">{formatCurrency(q.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Discount</span>
                <span className="text-red-500">- {formatCurrency(q.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span className="text-emerald-600">+ {formatCurrency(q.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2.5 border-t border-gray-200">
                <span>Total</span>
                <span className="text-blue-700">{formatCurrency(q.total)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-semibold text-gray-800 mb-3">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Currency</span><span className="font-medium">{q.currency}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Template</span><span className="font-medium capitalize">{q.pdf_template?.replace('template','Template ')}</span></div>
              {q.sent_at && <div className="flex justify-between"><span className="text-gray-500">Sent At</span><span className="font-medium">{formatDate(q.sent_at?.split('T')[0])}</span></div>}
            </div>
          </div>

          {q.converted_invoice_id && (
            <div className="card p-4 bg-purple-50 border-purple-100">
              <p className="text-sm font-medium text-purple-700 mb-2">Converted to Invoice</p>
              <Link to={`/invoices/${q.converted_invoice_id}`}
                className="btn-primary btn-sm w-full justify-center">View Invoice</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
