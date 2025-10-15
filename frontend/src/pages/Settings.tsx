import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Mail, Lock, Globe, Moon, Palette, Database, Shield } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    documentAlerts: true,
    campaignUpdates: false,
    weeklyReports: true,
    twoFactorAuth: false,
    autoSave: true,
    darkMode: false,
    language: 'en',
    timezone: 'America/Los_Angeles',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon size={32} style={{ marginRight: '12px' }} />
            Settings
          </h1>
          <p className="page-subtitle">Manage your account preferences and application settings</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Notifications Settings */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Notifications
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Manage how you receive notifications
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SettingToggle
              label="Email Notifications"
              description="Receive notifications via email"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <SettingToggle
              label="Push Notifications"
              description="Receive push notifications in your browser"
              checked={settings.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
            />
            <SettingToggle
              label="Document Alerts"
              description="Get notified when documents are uploaded or expire"
              checked={settings.documentAlerts}
              onChange={() => handleToggle('documentAlerts')}
            />
            <SettingToggle
              label="Campaign Updates"
              description="Receive updates about your marketing campaigns"
              checked={settings.campaignUpdates}
              onChange={() => handleToggle('campaignUpdates')}
            />
            <SettingToggle
              label="Weekly Reports"
              description="Get weekly performance summaries"
              checked={settings.weeklyReports}
              onChange={() => handleToggle('weeklyReports')}
            />
          </div>
        </div>

        {/* Security Settings */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Security
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Keep your account secure
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SettingToggle
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              checked={settings.twoFactorAuth}
              onChange={() => handleToggle('twoFactorAuth')}
            />
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button className="btn btn-secondary">
                <Lock size={20} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Palette size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Preferences
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Customize your experience
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SettingToggle
              label="Dark Mode"
              description="Use dark theme across the application"
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
            <SettingToggle
              label="Auto-Save"
              description="Automatically save your work"
              checked={settings.autoSave}
              onChange={() => handleToggle('autoSave')}
            />
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Data & Privacy
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Manage your data and privacy settings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-secondary">
              Download My Data
            </button>
            <button className="btn btn-secondary" style={{ color: '#dc2626' }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {description}
        </div>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#667eea' : '#d1d5db',
          transition: '0.3s',
          borderRadius: '28px'
        }}>
          <span style={{
            position: 'absolute',
            content: '',
            height: '20px',
            width: '20px',
            left: checked ? '28px' : '4px',
            bottom: '4px',
            backgroundColor: 'white',
            transition: '0.3s',
            borderRadius: '50%'
          }} />
        </span>
      </label>
    </div>
  );
}
