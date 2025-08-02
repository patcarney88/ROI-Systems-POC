/**
 * Settings Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * System settings and user preferences
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface Setting {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'input' | 'textarea';
  value: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [settings, setSettings] = useState<Record<string, Setting[]>>({
    general: [
      {
        id: 'notifications',
        label: 'Email Notifications',
        description: 'Receive email notifications for document processing updates',
        type: 'toggle',
        value: true
      },
      {
        id: 'language',
        label: 'Language',
        description: 'Select your preferred language for the interface',
        type: 'select',
        value: 'en',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' }
        ]
      },
      {
        id: 'timezone',
        label: 'Timezone',
        description: 'Your local timezone for date and time displays',
        type: 'select',
        value: 'America/New_York',
        options: [
          { label: 'Eastern Time (UTC-5)', value: 'America/New_York' },
          { label: 'Central Time (UTC-6)', value: 'America/Chicago' },
          { label: 'Mountain Time (UTC-7)', value: 'America/Denver' },
          { label: 'Pacific Time (UTC-8)', value: 'America/Los_Angeles' }
        ]
      },
      {
        id: 'theme',
        label: 'Theme',
        description: 'Choose your preferred interface theme',
        type: 'select',
        value: 'light',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'Auto', value: 'auto' }
        ]
      }
    ],
    processing: [
      {
        id: 'autoProcess',
        label: 'Auto-process Documents',
        description: 'Automatically start processing documents after upload',
        type: 'toggle',
        value: true
      },
      {
        id: 'ocrEnabled',
        label: 'OCR Processing',
        description: 'Enable optical character recognition for scanned documents',
        type: 'toggle',
        value: true
      },
      {
        id: 'maxFileSize',
        label: 'Maximum File Size',
        description: 'Maximum allowed file size for document uploads (MB)',
        type: 'select',
        value: '50',
        options: [
          { label: '10 MB', value: '10' },
          { label: '25 MB', value: '25' },
          { label: '50 MB', value: '50' },
          { label: '100 MB', value: '100' }
        ]
      },
      {
        id: 'retentionPeriod',
        label: 'Data Retention Period',
        description: 'How long to keep processed documents (days)',
        type: 'select',
        value: '365',
        options: [
          { label: '30 days', value: '30' },
          { label: '90 days', value: '90' },
          { label: '180 days', value: '180' },
          { label: '1 year', value: '365' },
          { label: 'Forever', value: '-1' }
        ]
      }
    ],
    security: [
      {
        id: 'twoFactor',
        label: 'Two-Factor Authentication',
        description: 'Enable two-factor authentication for additional security',
        type: 'toggle',
        value: false
      },
      {
        id: 'sessionTimeout',
        label: 'Session Timeout',
        description: 'Automatically log out after period of inactivity',
        type: 'select',
        value: '60',
        options: [
          { label: '15 minutes', value: '15' },
          { label: '30 minutes', value: '30' },
          { label: '1 hour', value: '60' },
          { label: '4 hours', value: '240' },
          { label: '8 hours', value: '480' }
        ]
      },
      {
        id: 'encryptionLevel',
        label: 'Encryption Level',
        description: 'Level of encryption for stored documents',
        type: 'select',
        value: 'aes256',
        options: [
          { label: 'AES-128', value: 'aes128' },
          { label: 'AES-256', value: 'aes256' },
          { label: 'AES-256-GCM', value: 'aes256gcm' }
        ]
      },
      {
        id: 'accessLogging',
        label: 'Access Logging',
        description: 'Log all document access and modifications',
        type: 'toggle',
        value: true
      }
    ],
    api: [
      {
        id: 'apiKey',
        label: 'API Key',
        description: 'Your API key for programmatic access',
        type: 'input',
        value: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        placeholder: 'API Key will be generated automatically'
      },
      {
        id: 'rateLimiting',
        label: 'Rate Limiting',
        description: 'Maximum API requests per minute',
        type: 'select',
        value: '100',
        options: [
          { label: '50 requests/min', value: '50' },
          { label: '100 requests/min', value: '100' },
          { label: '250 requests/min', value: '250' },
          { label: '500 requests/min', value: '500' }
        ]
      },
      {
        id: 'webhookUrl',
        label: 'Webhook URL',
        description: 'URL to receive processing completion notifications',
        type: 'input',
        value: '',
        placeholder: 'https://your-domain.com/webhook'
      }
    ]
  });

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'processing', label: 'Processing', icon: 'cog' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'api', label: 'API', icon: 'code' }
  ];

  const handleSettingChange = (tabId: string, settingId: string, newValue: any) => {
    setSettings(prev => ({
      ...prev,
      [tabId]: prev[tabId].map(setting =>
        setting.id === settingId ? { ...setting, value: newValue } : setting
      )
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      // Show success message
    }, 1500);
  };

  const getTabIcon = (iconName: string) => {
    const iconClasses = "w-5 h-5";
    
    switch (iconName) {
      case 'settings':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'cog':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'code':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderSettingInput = (tabId: string, setting: Setting) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <div className="flex items-center">
            <button
              onClick={() => handleSettingChange(tabId, setting.id, !setting.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                setting.value ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  setting.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(tabId, setting.id, e.target.value)}
            className="input w-full max-w-xs"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'input':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSettingChange(tabId, setting.id, e.target.value)}
            placeholder={setting.placeholder}
            className="input w-full max-w-xs"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Settings - ROI Systems</title>
        <meta name="description" content="Configure your ROI Systems preferences" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Settings
                </h1>
                <p className="text-text-secondary">
                  Configure your system preferences and security settings
                </p>
              </div>
              
              {hasChanges && (
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-text-secondary hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      {getTabIcon(tab.icon)}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6 capitalize">
                  {activeTab} Settings
                </h2>
                
                <div className="space-y-8">
                  {settings[activeTab]?.map((setting) => (
                    <div key={setting.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 mb-4 sm:mb-0 sm:mr-6">
                        <h3 className="text-sm font-medium text-text-primary mb-1">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {setting.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {renderSettingInput(activeTab, setting)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tab-specific additional content */}
                {activeTab === 'security' && (
                  <div className="mt-8 pt-6 border-t border-border-primary">
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-warning-800 mb-1">
                            Security Notice
                          </h4>
                          <p className="text-sm text-warning-700">
                            Changes to security settings may require re-authentication. 
                            Make sure you have access to your registered email address.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="mt-8 pt-6 border-t border-border-primary">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-primary-800 mb-1">
                            API Documentation
                          </h4>
                          <p className="text-sm text-primary-700 mb-2">
                            Visit our API documentation to learn how to integrate with ROI Systems.
                          </p>
                          <button className="text-sm text-primary-600 hover:text-primary-700 underline">
                            View API Docs →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default SettingsPage;