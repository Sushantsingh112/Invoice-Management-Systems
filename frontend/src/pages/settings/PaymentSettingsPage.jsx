import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_METHODS = ['cash','bank_transfer','upi','card','cheque','other'];

export default function PaymentSettingsPage() {
  const [form, setForm] = useState({
    currency_symbol:'₹', currency_code:'INR', currency_position:'before',
    thousand_separator:',', decimal_separator:'.', decimal_places:2,
    payment_methods:['cash','bank_transfer','upi'],
    payment_instructions:'', paypal_enabled:false, paypal_email:'',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    settingsAPI.getPayment().then(r => {
      const d = r.data.data;
      if (d) setForm(prev=>({...prev,...d}));
    }).catch(()=>{});
  }, []);

  const set = (f,v) => setForm(p=>({...p,[f]:v}));

  const toggleMethod = (m) => {
    const current = form.payment_methods || [];
    set('payment_methods', current.includes(m) ? current.filter(x=>x!==m) : [...current,m]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await settingsAPI.updatePayment(form); toast.success('Payment settings saved'); }
    catch { toast.error('Save failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="page-title flex items-center gap-2"><DollarSign size={20} className="text-green-600"/>Payment Settings</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Currency</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Currency Code</label>
              <select value={form.currency_code||'INR'} onChange={e=>set('currency_code',e.target.value)} className="form-select">
                {['INR','USD','EUR','GBP','AED','SGD','CAD','AUD'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Symbol</label>
              <input value={form.currency_symbol||'₹'} onChange={e=>set('currency_symbol',e.target.value)} className="form-input w-20"/>
            </div>
            <div className="form-group">
              <label className="form-label">Position</label>
              <select value={form.currency_position||'before'} onChange={e=>set('currency_position',e.target.value)} className="form-select">
                <option value="before">Before (₹100)</option>
                <option value="after">After (100₹)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Thousands Separator</label>
              <select value={form.thousand_separator||','} onChange={e=>set('thousand_separator',e.target.value)} className="form-select">
                <option value=",">, (Comma)</option>
                <option value=".">. (Period)</option>
                <option value=" ">  (Space)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Decimal Separator</label>
              <select value={form.decimal_separator||'.'} onChange={e=>set('decimal_separator',e.target.value)} className="form-select">
                <option value=".">. (Period)</option>
                <option value=",">, (Comma)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Decimal Places</label>
              <select value={form.decimal_places||2} onChange={e=>set('decimal_places',parseInt(e.target.value))} className="form-select">
                {[0,1,2,3].map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Accepted Payment Methods</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_METHODS.map(m => (
              <label key={m} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="checkbox" checked={(form.payment_methods||[]).includes(m)}
                  onChange={()=>toggleMethod(m)} className="w-4 h-4 text-blue-600"/>
                <span className="text-sm font-medium text-gray-700 capitalize">{m.replace(/_/g,' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Payment Instructions</h3>
          <div className="form-group">
            <textarea value={form.payment_instructions||''} onChange={e=>set('payment_instructions',e.target.value)}
              className="form-textarea" rows={4} placeholder="Bank: HDFC Bank&#10;Account: 123456789&#10;IFSC: HDFC0001234"/>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">{loading?<span className="spinner"/>:<Save size={15}/>} Save Settings</button>
        </div>
      </form>
    </div>
  );
}
