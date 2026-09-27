import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, Globe, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_LABELS = {
  quotation: 'Quotation',
  invoice: 'Invoice',
  estimate: 'Estimate',
  bill_to: 'Bill To',
  ship_to: 'Ship To',
  client: 'Client',
  quote_number: 'Quotation #',
  invoice_number: 'Invoice #',
  quote_date: 'Quotation Date',
  invoice_date: 'Invoice Date',
  valid_until: 'Valid Until',
  due_date: 'Due Date',
  item_name: 'Item / Description',
  quantity: 'Qty',
  unit_price: 'Unit Price',
  tax: 'Tax',
  discount: 'Discount',
  subtotal: 'Subtotal',
  total: 'Total',
  paid_amount: 'Amount Paid',
  balance_due: 'Balance Due',
  payment_instructions: 'Payment Instructions',
  terms_conditions: 'Terms & Conditions',
  notes: 'Notes',
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ar', name: 'Arabic (العربية)' },
];

export default function TranslationSettingsPage() {
  const [language, setLanguage] = useState('en');
  const [labels, setLabels] = useState(DEFAULT_LABELS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getTranslation();
      if (res.data?.data) {
        const data = res.data.data;
        if (data.language) setLanguage(data.language);
        if (data.labels && Object.keys(data.labels).length > 0) {
          setLabels(prev => ({ ...prev, ...data.labels }));
        }
      }
    } catch {
      toast.error('Failed to load translation settings');
    }
  };

  const handleLabelChange = (key, value) => {
    setLabels(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setLabels(DEFAULT_LABELS);
    toast.success('Reset to default English labels');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsAPI.updateTranslation({
        language,
        labels,
      });
      toast.success('Translation and labels saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save translations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Globe size={22} className="text-blue-600" />
            Translation & Custom Labels
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize language and document header labels used on PDFs, emails, and client-facing documents.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary self-start sm:self-auto text-xs"
        >
          <RefreshCw size={14} />
          Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language selector */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 border-b pb-3">Primary Document Language</h3>
          <div className="max-w-xs">
            <label className="form-label">System / Invoice Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="form-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Labels Dictionary */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 border-b pb-3">PDF & Document Terminology</h3>
          <p className="text-xs text-slate-500">
            Override any default wording displayed on your invoices and quotation printouts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {Object.entries(labels).map(([key, value]) => {
              const formattedLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={key} className="form-group">
                  <label className="form-label text-xs font-medium text-slate-600">
                    {formattedLabel}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => handleLabelChange(key, e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="spinner" /> : <Save size={16} />}
            Save Translation & Labels
          </button>
        </div>
      </form>
    </div>
  );
}
