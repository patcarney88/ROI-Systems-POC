import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSchema, type CampaignFormData } from '../schemas/validation';
import { notify } from '../utils/notifications';
import './Modal.css';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (campaign: any) => void;
}

const TEMPLATES = [
  'Annual Review Reminder',
  'Market Update',
  'New Listing Alert',
  'Anniversary Celebration',
  'Referral Request',
  'Document Expiry Notice',
  'Custom Template'
];

export default function CampaignModal({ isOpen, onClose, onLaunch }: CampaignModalProps) {
  const [launching, setLaunching] = useState(false);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      subject: '',
      template: TEMPLATES[0],
      recipients: 'all',
      schedule: 'now',
      scheduleDate: '',
      message: ''
    }
  });

  const schedule = watch('schedule');

  if (!isOpen) return null;

  const onSubmit = async (data: CampaignFormData) => {
    setLaunching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onLaunch(data);
    notify.success(data.schedule === 'now' ? 'Campaign sent successfully!' : 'Campaign scheduled successfully!');

    // Reset form
    reset();
    setLaunching(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>Create Email Campaign</h2>
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
                <label htmlFor="name">Campaign Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Q1 2025 Market Update"
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
                <label htmlFor="template">Email Template</label>
                <select
                  id="template"
                  {...register('template')}
                >
                  {TEMPLATES.map(template => (
                    <option key={template} value={template}>{template}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Email Subject *</label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Your Market Update for January 2025"
                  {...register('subject')}
                  className={errors.subject ? 'error' : ''}
                />
                {errors.subject && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.subject.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="recipients">Recipients *</label>
                <select
                  id="recipients"
                  {...register('recipients')}
                  className={errors.recipients ? 'error' : ''}
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active Clients Only</option>
                  <option value="at-risk">At-Risk Clients</option>
                  <option value="dormant">Dormant Clients</option>
                  <option value="recent">Recent Transactions (90 days)</option>
                </select>
                {errors.recipients && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.recipients.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="message">Message Content *</label>
                <textarea
                  id="message"
                  placeholder="Write your email message here..."
                  {...register('message')}
                  rows={6}
                  className={errors.message ? 'error' : ''}
                />
                {errors.message && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.message.message}
                  </span>
                )}
                <small style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)', marginTop: '0.25rem' }}>
                  Tip: Personalize with [CLIENT_NAME], [PROPERTY_ADDRESS], [AGENT_NAME]
                </small>
              </div>

              <div className="form-group">
                <label>Schedule</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="now"
                      {...register('schedule')}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Send Now</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="scheduled"
                      {...register('schedule')}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Schedule for Later</span>
                  </label>
                </div>
              </div>

              {schedule === 'scheduled' && (
                <div className="form-group">
                  <label htmlFor="scheduleDate">Send Date & Time *</label>
                  <input
                    id="scheduleDate"
                    type="datetime-local"
                    {...register('scheduleDate')}
                    min={new Date().toISOString().slice(0, 16)}
                    className={errors.scheduleDate ? 'error' : ''}
                  />
                  {errors.scheduleDate && (
                    <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {errors.scheduleDate.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={launching}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || launching}
            >
              {launching ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>{schedule === 'now' ? 'Send Campaign' : 'Schedule Campaign'}</span>
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
