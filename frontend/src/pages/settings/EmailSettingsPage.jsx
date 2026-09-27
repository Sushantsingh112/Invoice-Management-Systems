import { useState, useEffect } from 'react';
import { settingsAPI } from '@/services/api';
import { Save, Mail, Send, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailSettingsPage() {
  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    encryption: 'tls',
    from_name: '',
    from_email: '',
    templates: {
      quotation: {
        subject: 'Quotation {quote_number} from {business_name}',
        body: 'Dear {client_name},\n\nPlease find attached quotation {quote_number} for the amount of {total}.\nValid until: {valid_until}.\n\nThank you for your business!\n\nBest regards,\n{business_name}'
      },
      invoice: {
        subject: 'Invoice {invoice_number} from {business_name}',
        body: 'Dear {client_name},\n\nPlease find attached invoice {invoice_number} for the total amount of {total}.\nDue date: {due_date}.\n\nKindly make the payment as per the instructions provided.\n\nThank you!\n\nBest regards,\n{business_name}'
      },
      payment: {
        subject: 'Payment Receipt for Invoice {invoice_number}',
        body: 'Dear {client_name},\n\nThank you for your payment of {amount} received on {payment_date} for invoice {invoice_number}.\n\nYour balance due is: {balance_due}.\n\nBest regards,\n{business_name}'
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('smtp');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getEmail();
      if (res.data?.data) {
        const data = res.data.data;
        setForm(prev => ({
          ...prev,
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_username: data.smtp_username || '',
          smtp_password: data.smtp_password || '',
          encryption: data.encryption || 'tls',
          from_name: data.from_name || '',
          from_email: data.from_email || '',
          templates: {
            ...prev.templates,
            ...(data.templates || {})
          }
        }));
      }
    } catch {
      toast.error('Failed to load email settings');
    }
  };

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setTemplate = (type, key, val) => {
    setForm(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [type]: {
          ...(prev.templates[type] || {}),
          [key]: val
        }
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsAPI.updateEmail(form);
      toast.success('Email settings updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingTest(true);
    try {
      const res = await settingsAPI.testEmail(testEmail);
      if (res.data?.success) {
        toast.success(res.data.message || 'Test email sent successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to send test email');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending test email. Check SMTP settings.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Mail size={22} className="text-blue-600" />
          Email & SMTP Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure outgoing email server (SMTP), test delivery, and customize email notification templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'smtp'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SMTP Configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Email Templates
        </button>
      </div>

      {activeTab === 'smtp' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-slate-800 border-b pb-3">SMTP Server Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">SMTP Host</label>
                <input
                  type="text"
                  placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                  value={form.smtp_host}
                  onChange={e => setField('smtp_host', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  placeholder="587"
                  value={form.smtp_port}
                  onChange={e => setField('smtp_port', parseInt(e.target.value) || 587)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Username</label>
                <input
                  type="text"
                  placeholder="user@example.com"
                  value={form.smtp_username}
                  onChange={e => setField('smtp_username', e.target.value)}
                  className="form-input"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.smtp_password}
                    onChange={e => setField('smtp_password', e.target.value)}
                    className="form-input pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Encryption Protocol</label>
                <select
                  value={form.encryption}
                  onChange={e => setField('encryption', e.target.value)}
                  className="form-select"
                >
                  <option value="tls">TLS (Port 587 - Recommended)</option>
                  <option value="ssl">SSL (Port 465)</option>
                  <option value="none">None (Port 25)</option>
                </select>
              </div>
            </div>

            <h3 className="font-semibold text-slate-800 border-b pb-3 pt-2">Sender Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">From Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Business Billing"
                  value={form.from_name}
                  onChange={e => setField('from_name', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">From Email</label>
                <input
                  type="email"
                  placeholder="billing@mybusiness.com"
                  value={form.from_email}
                  onChange={e => setField('from_email', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="card p-6 bg-slate-50 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Send size={16} className="text-blue-600" />
              Send Test Email
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Send a test message using these SMTP credentials to verify configuration.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="test-recipient@example.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="form-input flex-1 bg-white"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={sendingTest}
                className="btn-secondary whitespace-nowrap"
              >
                {sendingTest ? <span className="spinner" /> : <Send size={15} />}
                Send Test
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="spinner" /> : <Save size={16} />}
              Save SMTP Settings
            </button>
          </div>
        </form>
      )}

      {activeTab === 'templates' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Quotation Email Template */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Quotation Email Template</span>
              <span className="text-xs font-normal text-slate-500">Variables: {'{client_name}'}, {'{quote_number}'}, {'{total}'}, {'{valid_until}'}, {'{business_name}'}</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                value={form.templates?.quotation?.subject || ''}
                onChange={e => setTemplate('quotation', 'subject', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Message Body</label>
              <textarea
                rows={5}
                value={form.templates?.quotation?.body || ''}
                onChange={e => setTemplate('quotation', 'body', e.target.value)}
                className="form-textarea font-mono text-sm"
              />
            </div>
          </div>

          {/* Invoice Email Template */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Invoice Email Template</span>
              <span className="text-xs font-normal text-slate-500">Variables: {'{client_name}'}, {'{invoice_number}'}, {'{total}'}, {'{due_date}'}, {'{business_name}'}</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                value={form.templates?.invoice?.subject || ''}
                onChange={e => setTemplate('invoice', 'subject', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Message Body</label>
              <textarea
                rows={6}
                value={form.templates?.invoice?.body || ''}
                onChange={e => setTemplate('invoice', 'body', e.target.value)}
                className="form-textarea font-mono text-sm"
              />
            </div>
          </div>

          {/* Payment Receipt Template */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Payment Receipt Template</span>
              <span className="text-xs font-normal text-slate-500">Variables: {'{client_name}'}, {'{invoice_number}'}, {'{amount}'}, {'{balance_due}'}, {'{payment_date}'}</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                value={form.templates?.payment?.subject || ''}
                onChange={e => setTemplate('payment', 'subject', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Message Body</label>
              <textarea
                rows={5}
                value={form.templates?.payment?.body || ''}
                onChange={e => setTemplate('payment', 'body', e.target.value)}
                className="form-textarea font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="spinner" /> : <Save size={16} />}
              Save Email Templates
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
