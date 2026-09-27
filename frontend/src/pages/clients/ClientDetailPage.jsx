import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientsAPI, invoicesAPI, quotationsAPI } from '@/services/api';
import { formatDate, getStatusColor, getStatusLabel, formatCurrency } from '@/utils/helpers';
import { ArrowLeft, Edit2, Mail, Phone, Building, MapPin, Receipt, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientsAPI.getById(id),
      invoicesAPI.getAll({ client_id: id, per_page: 10 }),
      quotationsAPI.getAll({ client_id: id, per_page: 10 }),
    ]).then(([cRes, iRes, qRes]) => {
      setClient(cRes.data.data);
      setInvoices(iRes.data.data);
      setQuotations(qRes.data.data);
    }).catch(() => {
      toast.error('Failed to load client details');
      navigate('/clients');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner-lg" /></div>;
  if (!client) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="btn-ghost btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{client.client_name}</h1>
            <p className="page-subtitle">{client.company_name || 'Individual Client'}</p>
          </div>
        </div>
        <Link to={`/clients/${id}/edit`} className="btn-secondary"><Edit2 size={15} /> Edit</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{client.client_name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{client.client_name}</h3>
              {client.company_name && <p className="text-sm text-gray-500">{client.company_name}</p>}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-blue-500 flex-shrink-0" />
              <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-700 break-all">{client.email}</a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{client.phone}</span>
              </div>
            )}
            {(client.city || client.country) && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-gray-700">
                  {[client.address, client.city, client.state, client.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {client.gst_number && (
              <div className="flex items-start gap-3 text-sm">
                <Building size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-400 block">GST Number</span>
                  <span className="text-gray-700 font-mono text-xs">{client.gst_number}</span>
                </div>
              </div>
            )}
          </div>

          {client.additional_info && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Additional Info</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{client.additional_info}</p>
            </div>
          )}
        </div>

        {/* Invoices & Quotations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Invoices */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Receipt size={15} className="text-blue-600" /> Invoices
              </h3>
              <Link to={`/invoices/new?client_id=${id}`} className="btn-primary btn-sm">+ New Invoice</Link>
            </div>
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No invoices yet</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Invoice #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-700 font-medium">{inv.invoice_number}</Link></td>
                      <td className="text-gray-500">{formatDate(inv.invoice_date)}</td>
                      <td className="font-semibold">{formatCurrency(inv.total)}</td>
                      <td><span className={`badge badge-${inv.status}`}>{getStatusLabel(inv.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Quotations */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={15} className="text-purple-600" /> Quotations
              </h3>
              <Link to={`/quotations/new?client_id=${id}`} className="btn-primary btn-sm">+ New Quote</Link>
            </div>
            {quotations.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No quotations yet</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Quote #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q.id}>
                      <td><Link to={`/quotations/${q.id}`} className="text-blue-600 hover:text-blue-700 font-medium">{q.quote_number}</Link></td>
                      <td className="text-gray-500">{formatDate(q.quote_date)}</td>
                      <td className="font-semibold">{formatCurrency(q.total)}</td>
                      <td><span className={`badge badge-${q.status}`}>{getStatusLabel(q.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
