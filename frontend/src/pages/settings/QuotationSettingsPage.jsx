import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuotationSettingsPage() {
  const [form, setForm] = useState({
    quote_prefix:'QUO', next_number:1, auto_numbering:true,
    date_format:'DD/MM/YYYY', validity_days:30,
    default_notes:'', default_terms:'', footer:'',
    email_subject:'', email_message:'', pdf_template:'template1'
  });
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    settingsAPI.getQuotation().then(r => setForm(r.data.data || form)).catch(()=>{});
    settingsAPI.getPdfTemplates().then(r => setTemplates(r.data.data)).catch(()=>{});
  }, []);

  const set = (f,v) => setForm(p=>({...p,[f]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await settingsAPI.updateQuotation(form); toast.success('Quotation settings saved'); }
    catch { toast.error('Save failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="page-title flex items-center gap-2"><FileText size={20} className="text-purple-600"/>Quotation Settings</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Numbering</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Quote Prefix</label>
              <input value={form.quote_prefix||''} onChange={e=>set('quote_prefix',e.target.value)} className="form-input font-mono"/>
            </div>
            <div className="form-group">
              <label className="form-label">Next Number</label>
              <input type="number" value={form.next_number||1} onChange={e=>set('next_number',parseInt(e.target.value))} className="form-input"/>
            </div>
            <div className="form-group flex items-center gap-3 pt-6">
              <input type="checkbox" id="auto_q" checked={!!form.auto_numbering} onChange={e=>set('auto_numbering',e.target.checked)} className="w-4 h-4 text-blue-600"/>
              <label htmlFor="auto_q" className="text-sm font-medium text-gray-700">Auto-numbering</label>
            </div>
            <div className="form-group">
              <label className="form-label">Date Format</label>
              <select value={form.date_format||'DD/MM/YYYY'} onChange={e=>set('date_format',e.target.value)} className="form-select">
                {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD','DD-MM-YYYY'].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Validity (Days)</label>
              <input type="number" value={form.validity_days||30} onChange={e=>set('validity_days',parseInt(e.target.value))} className="form-input"/>
            </div>
            <div className="form-group">
              <label className="form-label">Default Template</label>
              <select value={form.pdf_template||'template1'} onChange={e=>set('pdf_template',e.target.value)} className="form-select">
                {templates.map(t=><option key={t.template_key} value={t.template_key}>{t.template_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Default Content</h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Default Notes</label>
              <textarea value={form.default_notes||''} onChange={e=>set('default_notes',e.target.value)} className="form-textarea" rows={3}/>
            </div>
            <div className="form-group">
              <label className="form-label">Default Terms & Conditions</label>
              <textarea value={form.default_terms||''} onChange={e=>set('default_terms',e.target.value)} className="form-textarea" rows={3}/>
            </div>
            <div className="form-group">
              <label className="form-label">PDF Footer</label>
              <textarea value={form.footer||''} onChange={e=>set('footer',e.target.value)} className="form-textarea" rows={2}/>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Email Template</h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email Subject</label>
              <input value={form.email_subject||''} onChange={e=>set('email_subject',e.target.value)} className="form-input" placeholder="Quotation {{quote_number}} from {{company_name}}"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email Message</label>
              <textarea value={form.email_message||''} onChange={e=>set('email_message',e.target.value)} className="form-textarea" rows={4} placeholder="Dear {{client_name}}, Please find attached..."/>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">{loading?<span className="spinner"/>:<Save size={15}/>} Save Settings</button>
        </div>
      </form>
    </div>
  );
}
