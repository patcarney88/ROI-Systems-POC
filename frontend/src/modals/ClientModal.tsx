import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientFormData } from '../schemas/validation';
import { notify } from '../utils/notifications';
import './Modal.css';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  client?: any;
}

export default function ClientModal({ isOpen, onClose, onSave, client }: ClientModalProps) {
  const [saving, setSaving] = useState(false);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      properties: 0,
      status: 'active',
      notes: ''
    }
  });

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (client) {
      reset({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        properties: client.properties || 0,
        status: client.status || 'active',
        notes: client.notes || ''
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        properties: 0,
        status: 'active',
        notes: ''
      });
    }
  }, [client, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ClientFormData) => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    onSave({ ...data, id: client?.id });
    notify.success(client ? 'Client updated successfully' : 'Client added successfully');
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{client ? 'Edit Client' : 'Add New Client'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="upload-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...register('name')}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number (Optional)</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.phone.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="properties">Number of Properties</label>
                <input
                  id="properties"
                  type="number"
                  min="0"
                  {...register('properties', { valueAsNumber: true })}
                  className={errors.properties ? 'error' : ''}
                />
                {errors.properties && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.properties.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status">Client Status</label>
                <select
                  id="status"
                  {...register('status')}
                >
                  <option value="active">Active</option>
                  <option value="at-risk">At Risk</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  placeholder="Additional notes about this client..."
                  {...register('notes')}
                  rows={4}
                  className={errors.notes ? 'error' : ''}
                />
                {errors.notes && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.notes.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || saving}
            >
              {saving ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{client ? 'Update Client' : 'Add Client'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
