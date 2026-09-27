import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, Calculator, Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaxSettingsPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTax, setNewTax] = useState({ tax_name:'GST', tax_percentage:18, tax_type:'exclusive', is_default:false });

  const load = () => settingsAPI.getTax().then(r => setTaxes(r.data.data)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await settingsAPI.createTax(newTax); toast.success('Tax created'); setNewTax({tax_name:'',tax_percentage:0,tax_type:'exclusive',is_default:false}); load(); }
    catch { toast.error('Failed to create tax'); }
    finally { setLoading(false); }
  };

  const handleSetDefault = async (id) => {
    try { await settingsAPI.updateTax(id, { is_default:true }); load(); toast.success('Default tax updated'); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax?')) return;
    try { await settingsAPI.deleteTax(id); toast.success('Tax deleted'); load(); }
    catch { toast.error('Failed to delete tax'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="page-title flex items-center gap-2"><Calculator size={20} className="text-blue-600"/>Tax Settings</h1></div>

      {/* Existing Taxes */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">Tax Rates</div>
        {taxes.length === 0 ? (
          <div className="empty-state py-8"><p className="text-gray-400">No tax rates configured</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Tax Name</th><th>Rate</th><th>Type</th><th>Default</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {taxes.map(t => (
                <tr key={t.id}>
                  <td className="font-medium text-gray-800">{t.tax_name}</td>
                  <td className="font-mono font-bold text-blue-600">{t.tax_percentage}%</td>
                  <td><span className="badge bg-gray-100 text-gray-600 capitalize">{t.tax_type}</span></td>
                  <td>
                    {t.is_default ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><Check size={14}/> Default</span>
                    ) : (
                      <button onClick={() => handleSetDefault(t.id)} className="text-xs text-blue-600 hover:text-blue-700 underline">Set Default</button>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button onClick={() => handleDelete(t.id)} className="btn-ghost btn-icon text-gray-400 hover:text-red-500 h-7 w-7">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add New Tax */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Plus size={16} className="text-blue-600"/>Add Tax Rate</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="form-group">
            <label className="form-label">Tax Name</label>
            <input value={newTax.tax_name} onChange={e=>setNewTax(p=>({...p,tax_name:e.target.value}))} className="form-input" required placeholder="GST 18%"/>
          </div>
          <div className="form-group">
            <label className="form-label">Rate (%)</label>
            <input type="number" step="0.01" min="0" max="100" value={newTax.tax_percentage}
              onChange={e=>setNewTax(p=>({...p,tax_percentage:parseFloat(e.target.value)}))} className="form-input font-mono"/>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select value={newTax.tax_type} onChange={e=>setNewTax(p=>({...p,tax_type:e.target.value}))} className="form-select">
              <option value="exclusive">Exclusive</option>
              <option value="inclusive">Inclusive</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={newTax.is_default} onChange={e=>setNewTax(p=>({...p,is_default:e.target.checked}))} className="w-4 h-4 text-blue-600"/>
              <span className="text-sm text-gray-600">Default</span>
            </label>
            <button type="submit" disabled={loading} className="btn-primary mb-0.5">
              {loading?<span className="spinner"/>:<Plus size={14}/>} Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
