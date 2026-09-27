import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clientsAPI } from '@/services/api';
import Pagination from '@/components/Pagination';
import { ConfirmDialog } from '@/components/Modal';
import { formatDate, getStatusColor } from '@/utils/helpers';
import { Plus, Search, Edit2, Trash2, Eye, Users, Phone, Mail, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientsAPI.getAll({ page, per_page: 15, search });
      setClients(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search, page: 1 });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await clientsAPI.delete(deleteId);
      toast.success('Client deleted successfully');
      setDeleteId(null);
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{pagination?.total || 0} total clients</p>
        </div>
        <Link to="/clients/new" className="btn-primary">
          <Plus size={16} /> Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="search-bar flex-1 max-w-sm">
            <Search size={15} className="icon" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, company..."
              className="form-input pl-9 w-full"
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchParams({ page: 1 }); }}
              className="btn-secondary">Clear</button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner-lg" /></div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="text-gray-200 mb-3" />
            <h3 className="text-gray-500 font-medium">No clients found</h3>
            <p className="text-gray-400 text-sm mt-1">Create your first client to get started</p>
            <Link to="/clients/new" className="btn-primary mt-4"><Plus size={16} /> Add Client</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>GST/Tax No.</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                            flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {client.client_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link to={`/clients/${client.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {client.client_name}
                            </Link>
                            <div className="text-xs text-gray-400">
                              Added {formatDate(client.created_at?.split('T')[0])}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Building size={13} className="text-gray-400" />
                          {client.company_name || <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${client.email}`}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm">
                          <Mail size={13} /> {client.email}
                        </a>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone size={13} className="text-gray-400" />
                          {client.phone || <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="text-gray-600">
                        {[client.city, client.state, client.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="text-gray-600 font-mono text-xs">
                        {client.gst_number || client.tax_number || '—'}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/clients/${client.id}`} className="btn-ghost btn-icon text-gray-400 hover:text-blue-600" title="View">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/clients/${client.id}/edit`} className="btn-ghost btn-icon text-gray-400 hover:text-yellow-600" title="Edit">
                            <Edit2 size={15} />
                          </Link>
                          <button onClick={() => setDeleteId(client.id)}
                            className="btn-ghost btn-icon text-gray-400 hover:text-red-500" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination pagination={pagination}
                onPageChange={p => setSearchParams({ search, page: p })} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
      />
    </div>
  );
}
