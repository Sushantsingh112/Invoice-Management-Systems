import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoicesAPI } from '@/services/api';
import { formatDate, formatCurrency, getStatusLabel, downloadBlob } from '@/utils/helpers';
import { Modal } from '@/components/Modal';
import { ArrowLeft, Edit2, Download, Send, Copy, CreditCard,
         Plus, CheckCircle, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function RecordPaymentModal({ isOpen, onClose, invoice, onSuccess }) {
  const [form, setForm] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer', transaction_id: '', notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) setForm(f => ({ ...f, amount: parseFloat(invoice.balance_due || 0).toFixed(2) }));
  }, [isOpen, invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await invoicesAPI.recordPayment(invoice.id, form);
      toast.success('Payment recorded successfully');
      onSuccess();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record payment'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit}>
        <div className="modal-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Amount <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" min="0.01" required
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="form-input font-mono" />
              <p className="text-xs text-gray-400 mt-1">Balance due: {formatCurrency(invoice?.balance_due)}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input type="date" value={form.payment_date}
                onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="form-select">
              {[['cash','Cash'],['bank_transfer','Bank Transfer'],['upi','UPI'],
                ['card','Card'],['cheque','Cheque'],['other','Other']].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Transaction ID / Reference</label>
            <input value={form.transaction_id}
              onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
              className="form-input font-mono" placeholder="UTR / Cheque number..." />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="form-textarea" rows={2} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-success">
            {loading ? <span className="spinner" /> : <CheckCircle size={15} />} Record Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-400',
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    try {
      const res = await invoicesAPI.getById(id);
      setInvoice(res.data.data);
    } catch { toast.error('Invoice not found'); navigate('/invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const setAction = (v) => setActionLoading(v);

  const handleSend = async () => {
    setAction('sending');
    try {
      await invoicesAPI.send(id);
      toast.success('Invoice sent via email');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Send failed'); }
    finally { setAction(''); }
  };

  const handlePdf = async () => {
    setAction('pdf');
    try {
      const res = await invoicesAPI.getPdf(id);
      downloadBlob(res.data, `${invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF generation failed'); }
    finally { setAction(''); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner-lg" /></div>;
  if (!invoice) return null;

  const inv = invoice;
  const client = inv.client;
  const isPaid = inv.status === 'paid';
  const isCancelled = inv.status === 'cancelled';
  const canPay = !isPaid && !isCancelled && parseFloat(inv.balance_due) > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{inv.invoice_number}</h1>
              <span className={`badge ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                {getStatusLabel(inv.status)}
              </span>
            </div>
            <p className="page-subtitle">{client?.client_name} · Due {formatDate(inv.due_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isPaid && !isCancelled && (
            <Link to={`/invoices/${id}/edit`} className="btn-secondary btn-sm"><Edit2 size={14}/> Edit</Link>
          )}
          <button onClick={handlePdf} disabled={actionLoading==='pdf'} className="btn-secondary btn-sm">
            {actionLoading==='pdf' ? <span className="spinner"/> : <Download size={14}/>} PDF
          </button>
          <button onClick={handleSend} disabled={actionLoading==='sending'} className="btn-secondary btn-sm">
            {actionLoading==='sending' ? <span className="spinner"/> : <Send size={14}/>} Send
          </button>
          {canPay && (
            <button onClick={() => setPaymentModalOpen(true)} className="btn-success btn-sm">
              <CreditCard size={14}/> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bill To</p>
                <p className="font-semibold text-gray-800">{client?.client_name}</p>
                {client?.company_name && <p className="text-sm text-gray-500">{client.company_name}</p>}
                {client?.email && <p className="text-sm text-blue-600">{client.email}</p>}
                {client?.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
                {client?.address && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{client.address}</p>}
                {client?.gst_number && <p className="text-xs text-gray-400 mt-1">GST: {client.gst_number}</p>}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-0.5">Invoice Date</p>
                  <p className="font-medium text-gray-700">{formatDate(inv.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-0.5">Due Date</p>
                  <p className={`font-medium ${new Date(inv.due_date) < new Date() && !isPaid ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatDate(inv.due_date)}
                  </p>
                </div>
                {inv.reference && <div>
                  <p className="text-xs text-gray-400 uppercase mb-0.5">Reference</p>
                  <p className="font-medium text-gray-700">{inv.reference}</p>
                </div>}
              </div>
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
                  <tr><th>Item</th><th className="text-center">Qty</th>
                    <th className="text-right">Rate</th><th className="text-right">Disc</th>
                    <th className="text-right">Tax</th><th className="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {inv.items?.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div className="font-medium text-gray-800">{item.item_name}</div>
                        {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                      </td>
                      <td className="text-center text-gray-600">{item.quantity}</td>
                      <td className="text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right text-red-500">{item.discount_percentage > 0 ? `${item.discount_percentage}%` : '—'}</td>
                      <td className="text-right text-emerald-600">{item.tax_percentage > 0 ? `${item.tax_percentage}%` : '—'}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          {inv.payments?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Payment History</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {inv.payments.map(p => (
                    <tr key={p.id}>
                      <td>{formatDate(p.payment_date)}</td>
                      <td className="capitalize">{p.payment_method?.replace(/_/g,' ')}</td>
                      <td className="font-mono text-xs text-gray-500">{p.transaction_id || '—'}</td>
                      <td className="text-right font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes & Terms */}
          {(inv.notes || inv.terms) && (
            <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {inv.notes && <div>
                <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{inv.notes}</p>
              </div>}
              {inv.terms && <div>
                <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{inv.terms}</p>
              </div>}
            </div>
          )}
        </div>

        {/* Sidebar: Totals & Payment Summary */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Summary</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span className="font-medium">{formatCurrency(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-500">- {formatCurrency(inv.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-emerald-600">+ {formatCurrency(inv.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Total</span><span className="text-blue-700">{formatCurrency(inv.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid</span>
                <span className="text-green-600 font-medium">{formatCurrency(inv.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-gray-300">
                <span>Balance Due</span>
                <span className={parseFloat(inv.balance_due) > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(inv.balance_due)}
                </span>
              </div>
            </div>
            {canPay && (
              <button onClick={() => setPaymentModalOpen(true)}
                className="btn-success w-full justify-center mt-4">
                <CreditCard size={15} /> Record Payment
              </button>
            )}
          </div>

          <div className="card p-5">
            <h4 className="font-semibold text-gray-800 mb-3">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Currency</span><span className="font-medium">{inv.currency}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Template</span><span className="font-medium capitalize">{inv.pdf_template?.replace('template','Template ')}</span></div>
              {inv.sent_at && <div className="flex justify-between"><span className="text-gray-500">Sent</span><span className="font-medium">{formatDate(inv.sent_at?.split('T')[0])}</span></div>}
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={inv}
        onSuccess={load}
      />
    </div>
  );
}
