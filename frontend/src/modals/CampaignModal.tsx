import { useState } from 'react';
import './Modal.css';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (campaign: CampaignData) => void;
}

interface CampaignData {
  name: string;
  subject: string;
  template: string;
  recipients: string;
  schedule: 'now' | 'scheduled';
  scheduleDate?: string;
  message: string;
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
  const [formData, setFormData] = useState<CampaignData>({
    name: '',
    subject: '',
    template: TEMPLATES[0],
    recipients: 'all',
    schedule: 'now',
    scheduleDate: '',
    message: ''
  });
  const [launching, setLaunching] = useState(false);

  if (!isOpen) return null;

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.message) return;

    setLaunching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onLaunch(formData);

    // Reset form
    setFormData({
      name: '',
      subject: '',
      template: TEMPLATES[0],
      recipients: 'all',
      schedule: 'now',
      scheduleDate: '',
      message: ''
    });
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

        <form onSubmit={handleLaunch}>
          <div className="modal-body">
            <div className="upload-form">
              <div className="form-group">
                <label htmlFor="name">Campaign Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Q1 2025 Market Update"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="template">Email Template</label>
                <select
                  id="template"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
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
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="recipients">Recipients</label>
                <select
                  id="recipients"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active Clients Only</option>
                  <option value="at-risk">At-Risk Clients</option>
                  <option value="dormant">Dormant Clients</option>
                  <option value="recent">Recent Transactions (90 days)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message Content *</label>
                <textarea
                  id="message"
                  placeholder="Write your email message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  required
                />
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
                      name="schedule"
                      value="now"
                      checked={formData.schedule === 'now'}
                      onChange={() => setFormData({ ...formData, schedule: 'now', scheduleDate: '' })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Send Now</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="schedule"
                      value="scheduled"
                      checked={formData.schedule === 'scheduled'}
                      onChange={() => setFormData({ ...formData, schedule: 'scheduled' })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Schedule for Later</span>
                  </label>
                </div>
              </div>

              {formData.schedule === 'scheduled' && (
                <div className="form-group">
                  <label htmlFor="scheduleDate">Send Date & Time</label>
                  <input
                    id="scheduleDate"
                    type="datetime-local"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
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
              disabled={!formData.name || !formData.subject || !formData.message || launching}
            >
              {launching ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>{formData.schedule === 'now' ? 'Send Campaign' : 'Schedule Campaign'}</span>
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
