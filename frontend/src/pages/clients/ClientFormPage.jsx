import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientsAPI } from '@/services/api';
import { ArrowLeft, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Valid email required'),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  gst_number: z.string().optional(),
  tax_number: z.string().optional(),
  additional_info: z.string().optional(),
});

export default function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (isEdit) {
      clientsAPI.getById(id)
        .then(res => { reset(res.data.data); setFetching(false); })
        .catch(() => { toast.error('Failed to load client'); navigate('/clients'); });
    }
  }, [id]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await clientsAPI.update(id, data);
        toast.success('Client updated successfully');
      } else {
        await clientsAPI.create(data);
        toast.success('Client created successfully');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64"><div className="spinner-lg" /></div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')} className="btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Client' : 'Add New Client'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update client information' : 'Add a new client to your system'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-600" /> Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Client Name <span className="text-red-500">*</span></label>
              <input {...register('client_name')} className={errors.client_name ? 'form-input-error' : 'form-input'} placeholder="Full name" />
              {errors.client_name && <p className="form-error">{errors.client_name.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input {...register('company_name')} className="form-input" placeholder="Company / Business name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="text-red-500">*</span></label>
              <input {...register('email')} type="email" className={errors.email ? 'form-input-error' : 'form-input'} placeholder="email@example.com" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input {...register('phone')} className="form-input" placeholder="+91-XXXXXXXXXX" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Street Address</label>
              <textarea {...register('address')} className="form-textarea" rows={2} placeholder="Street address, building number..." />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input {...register('city')} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">State / Province</label>
              <input {...register('state')} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input {...register('country')} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input {...register('postal_code')} className="form-input" />
            </div>
          </div>
        </div>

        {/* Tax & Additional */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Tax & Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input {...register('gst_number')} className="form-input font-mono" placeholder="27XXXXX1234X1ZX" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax / PAN Number</label>
              <input {...register('tax_number')} className="form-input font-mono" />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Additional Information</label>
              <textarea {...register('additional_info')} className="form-textarea" rows={3}
                placeholder="Any additional notes about this client..." />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="spinner" /> : <Save size={16} />}
            {isEdit ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
