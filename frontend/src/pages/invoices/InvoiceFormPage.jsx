import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { invoicesAPI, clientsAPI, settingsAPI } from '@/services/api';
import LineItemsEditor from '@/components/LineItemsEditor';
import { today, addDays, calcDocumentTotals } from '@/utils/helpers';
import { ArrowLeft, Save, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [invSettings, setInvSettings] = useState(null);

  const [form, setForm] = useState({
    invoice_number: '', client_id: searchParams.get('client_id') || '',
    invoice_date: today(), due_date: addDays(today(), 30),
    currency: 'INR', reference: '', notes: '', terms: '',
    pdf_template: 'template1', status: 'draft',
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    Promise.all([
      clientsAPI.getAllSimple(), settingsAPI.getPdfTemplates(),
      settingsAPI.getPayment(), settingsAPI.getInvoice(),
    ]).then(([cRes, tRes, psRes, isRes]) => {
      setClients(cRes.data.data); setTemplates(tRes.data.data);
      setPaymentSettings(psRes.data.data); setInvSettings(isRes.data.data);
      if (!isEdit) {
        setForm(f => ({
          ...f,
          notes: isRes.data.data.default_notes || '',
          terms: isRes.data.data.default_terms || '',
          pdf_template: isRes.data.data.pdf_template || 'template1',
          due_date: addDays(today(), isRes.data.data.default_due_days || 30),
        }));
      }
    }).catch(() => toast.error('Failed to load form data'));

    if (isEdit) {
      invoicesAPI.getById(id).then(res => {
        const inv = res.data.data;
        setForm({
          invoice_number: inv.invoice_number, client_id: inv.client_id,
          invoice_date: inv.invoice_date, due_date: inv.due_date,
          currency: inv.currency, reference: inv.reference || '',
          notes: inv.notes || '', terms: inv.terms || '',
          pdf_template: inv.pdf_template || 'template1', status: inv.status,
        });
        setItems(inv.items || []);
        setFetching(false);
      }).catch(() => { toast.error('Failed to load invoice'); navigate('/invoices'); });
    }
  }, [id]);

  const handleChange = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id) return toast.error('Please select a client');
    if (!items.length) return toast.error('Add at least one line item');

    setLoading(true);
    const totals = calcDocumentTotals(items);
    const payload = { ...form, items: items.map(it => ({
      item_name: it.item_name, description: it.description || '',
      quantity: parseFloat(it.quantity) || 1, unit_price: parseFloat(it.unit_price) || 0,
      discount_percentage: parseFloat(it.discount_percentage) || 0,
      tax_percentage: parseFloat(it.tax_percentage) || 0,
    })), ...totals };

    try {
      if (isEdit) {
        await invoicesAPI.update(id, payload);
        toast.success('Invoice updated successfully');
      } else {
        await invoicesAPI.create(payload);
        toast.success('Invoice created successfully');
      }
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="flex items-center justify-center h-64"><div className="spinner-lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt size={20} className="text-blue-600" />
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          <p className="page-subtitle">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input value={form.invoice_number} onChange={e => handleChange('invoice_number', e.target.value)}
                className="form-input font-mono" placeholder="Auto-generated" />
            </div>
            <div className="form-group">
              <label className="form-label">Client <span className="text-red-500">*</span></label>
              <select value={form.client_id} onChange={e => handleChange('client_id', e.target.value)}
                className="form-select" required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select value={form.currency} onChange={e => handleChange('currency', e.target.value)} className="form-select">
                {['INR','USD','EUR','GBP','AED'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input type="date" value={form.invoice_date} onChange={e => handleChange('invoice_date', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => handleChange('due_date', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Reference</label>
              <input value={form.reference} onChange={e => handleChange('reference', e.target.value)} className="form-input" placeholder="Project reference" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="form-select">
                {['draft','sent','partially_paid','paid','overdue','cancelled'].map(s =>
                  <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">PDF Template</label>
              <select value={form.pdf_template} onChange={e => handleChange('pdf_template', e.target.value)} className="form-select">
                {templates.map(t => <option key={t.template_key} value={t.template_key}>{t.template_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Line Items</h3>
          <LineItemsEditor value={items} onChange={setItems} currency={form.currency} paymentSettings={paymentSettings} />
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)}
                className="form-textarea" rows={4} placeholder="Notes visible to client..." />
            </div>
            <div className="form-group">
              <label className="form-label">Terms & Conditions</label>
              <textarea value={form.terms} onChange={e => handleChange('terms', e.target.value)}
                className="form-textarea" rows={4} placeholder="Payment terms..." />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-4">
          <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="spinner" /> : <Save size={16} />}
            {isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
