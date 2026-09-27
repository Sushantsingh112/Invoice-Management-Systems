import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, Building2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BusinessSettingsPage() {
  const [form, setForm] = useState({
    business_name:'',address:'',extra_info:'',email:'',phone:'',website:'',
    gst_number:'',vat_number:'',registration_number:'',
    country:'',city:'',state:'',postal_code:''
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    settingsAPI.getBusiness().then(res => {
      const d = res.data.data;
      setForm(d || {});
      if (d?.logo_path) setLogoPreview(`/api/settings/uploads/${d.logo_path}`);
    }).catch(() => toast.error('Failed to load settings'))
    .finally(() => setFetching(false));
  }, []);

  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    try {
      const res = await settingsAPI.uploadLogo(logoFile);
      setLogoPreview(`/api/settings/uploads/${res.data.data.logo_path}`);
      toast.success('Logo uploaded successfully');
    } catch { toast.error('Logo upload failed'); }
    finally { setLogoUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsAPI.updateBusiness(form);
      toast.success('Business settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="flex items-center justify-center h-64"><div className="spinner-lg"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Building2 size={20} className="text-blue-600"/>Business Settings</h1>
          <p className="page-subtitle">Your company information shown on invoices and quotations</p>
        </div>
      </div>

      {/* Logo */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Company Logo</h3>
        <div className="flex items-center gap-6">
          <div className="w-28 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="object-contain w-full h-full p-2" />
            ) : (
              <Building2 size={32} className="text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <label className="btn-secondary cursor-pointer">
              <Upload size={15}/> Choose Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            {logoFile && (
              <button onClick={handleUploadLogo} disabled={logoUploading} className="btn-primary block">
                {logoUploading ? <span className="spinner"/> : null} Upload
              </button>
            )}
            <p className="text-xs text-gray-400">PNG, JPG, WebP · Max 2MB · Recommended: 400×120px</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Business Name <span className="text-red-500">*</span></label>
              <input value={form.business_name || ''} onChange={e => handleChange('business_name', e.target.value)} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input value={form.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="form-input" />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Website</label>
              <input value={form.website || ''} onChange={e => handleChange('website', e.target.value)} className="form-input" placeholder="www.example.com" />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Address</label>
              <textarea value={form.address || ''} onChange={e => handleChange('address', e.target.value)} className="form-textarea" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input value={form.city || ''} onChange={e => handleChange('city', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input value={form.state || ''} onChange={e => handleChange('state', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input value={form.country || ''} onChange={e => handleChange('country', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input value={form.postal_code || ''} onChange={e => handleChange('postal_code', e.target.value)} className="form-input" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Tax Registration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input value={form.gst_number || ''} onChange={e => handleChange('gst_number', e.target.value)} className="form-input font-mono" placeholder="27XXXXX1234X1ZX" />
            </div>
            <div className="form-group">
              <label className="form-label">VAT Number</label>
              <input value={form.vat_number || ''} onChange={e => handleChange('vat_number', e.target.value)} className="form-input font-mono" />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Number</label>
              <input value={form.registration_number || ''} onChange={e => handleChange('registration_number', e.target.value)} className="form-input font-mono" />
            </div>
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Extra Info (shown on PDF)</label>
            <textarea value={form.extra_info || ''} onChange={e => handleChange('extra_info', e.target.value)} className="form-textarea" rows={3} placeholder="CIN, PAN, etc." />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="spinner"/> : <Save size={15}/>} Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
