import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GeneralSettingsPage() {
  const [form, setForm] = useState({ year_start: '', year_end: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    settingsAPI.getGeneral().then(r => setForm(r.data.data || {})).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await settingsAPI.updateGeneral(form); toast.success('General settings saved'); }
    catch { toast.error('Save failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="page-title flex items-center gap-2"><Sliders size={20} className="text-blue-600"/>General Settings</h1></div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Financial Year</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Year Start</label>
            <input type="date" value={form.year_start || ''} onChange={e => setForm(f=>({...f,year_start:e.target.value}))} className="form-input"/>
          </div>
          <div className="form-group">
            <label className="form-label">Year End</label>
            <input type="date" value={form.year_end || ''} onChange={e => setForm(f=>({...f,year_end:e.target.value}))} className="form-input"/>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">{loading?<span className="spinner"/>:<Save size={15}/>} Save</button>
        </div>
      </form>
    </div>
  );
}
