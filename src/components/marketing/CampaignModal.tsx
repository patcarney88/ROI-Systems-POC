/**
 * Campaign Creation Modal
 * Designed by: Marketing Specialist + Frontend Specialist
 * 
 * Modal for creating and editing email marketing campaigns
 */

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: CampaignFormData) => void;
  editingCampaign?: CampaignFormData | null;
}

interface CampaignFormData {
  id?: string;
  name: string;
  type: 'welcome' | 'follow_up' | 'newsletter' | 'anniversary' | 'referral';
  subject: string;
  template: string;
  recipients: string[];
  scheduledDate?: string;
  content?: string;
}

interface HomeownerSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: string;
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCampaign
}) => {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: 'welcome',
    subject: '',
    template: '',
    recipients: [],
    scheduledDate: '',
    content: '',
    ...editingCampaign
  });

  const [selectedSegments, setSelectedSegments] = useState<string[]>(
    editingCampaign?.recipients || []
  );
  const [currentStep, setCurrentStep] = useState(1);

  // Mock homeowner segments for targeting
  const homeownerSegments: HomeownerSegment[] = [
    {
      id: 'new_homeowners',
      name: 'New Homeowners',
      description: 'Recently closed within last 30 days',
      count: 24,
      criteria: 'Closing date within 30 days'
    },
    {
      id: 'first_time_buyers',
      name: 'First-Time Buyers',
      description: 'Buyers purchasing their first home',
      count: 18,
      criteria: 'First-time buyer flag = true'
    },
    {
      id: 'anniversary_1yr',
      name: '1-Year Anniversary',
      description: 'Homeowners celebrating 1 year',
      count: 67,
      criteria: 'Closing date 1 year ago'
    },
    {
      id: 'high_value_homes',
      name: 'Luxury Properties',
      description: 'Properties valued over $500K',
      count: 89,
      criteria: 'Purchase price > $500,000'
    },
    {
      id: 'refinance_clients',
      name: 'Refinance Clients',
      description: 'Recent refinance transactions',
      count: 34,
      criteria: 'Transaction type = Refinance'
    },
    {
      id: 'referral_sources',
      name: 'Past Referrers',
      description: 'Clients who have made referrals',
      count: 12,
      criteria: 'Has made referral = true'
    }
  ];

  const campaignTypes = [
    {
      value: 'welcome',
      label: 'Welcome Series',
      description: 'Onboard new homeowners with helpful resources'
    },
    {
      value: 'follow_up',
      label: 'Follow-up',
      description: 'Check in with recent buyers'
    },
    {
      value: 'newsletter',
      label: 'Newsletter',
      description: 'Regular market updates and tips'
    },
    {
      value: 'anniversary',
      label: 'Anniversary',
      description: 'Celebrate homeownership milestones'
    },
    {
      value: 'referral',
      label: 'Referral Program',
      description: 'Encourage client referrals'
    }
  ];

  const emailTemplates = [
    {
      id: 'welcome_template_1',
      name: 'Welcome Series Template',
      description: 'Warm welcome with home maintenance tips',
      type: 'welcome'
    },
    {
      id: 'followup_template_1',
      name: 'Check-in Template',
      description: 'Casual follow-up with support resources',
      type: 'follow_up'
    },
    {
      id: 'newsletter_template_1',
      name: 'Market Update Newsletter',
      description: 'Professional market insights and tips',
      type: 'newsletter'
    },
    {
      id: 'anniversary_template_1',
      name: 'Anniversary Celebration',
      description: 'Milestone celebration with rewards',
      type: 'anniversary'
    },
    {
      id: 'referral_template_1',
      name: 'Referral Rewards',
      description: 'Incentive-based referral program',
      type: 'referral'
    }
  ];

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSubmit = () => {
    const totalRecipients = selectedSegments.reduce((total, segmentId) => {
      const segment = homeownerSegments.find(s => s.id === segmentId);
      return total + (segment?.count || 0);
    }, 0);

    onSave({
      ...formData,
      recipients: selectedSegments,
    });
    
    // Reset form
    setFormData({
      name: '',
      type: 'welcome',
      subject: '',
      template: '',
      recipients: [],
      scheduledDate: '',
      content: ''
    });
    setSelectedSegments([]);
    setCurrentStep(1);
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Campaign Details';
      case 2: return 'Select Recipients';
      case 3: return 'Schedule & Review';
      default: return 'Create Campaign';
    }
  };

  const totalRecipients = selectedSegments.reduce((total, segmentId) => {
    const segment = homeownerSegments.find(s => s.id === segmentId);
    return total + (segment?.count || 0);
  }, 0);

  const filteredTemplates = emailTemplates.filter(template => 
    template.type === formData.type
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
      description={getStepTitle()}
    >
      <ModalBody className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-200 text-secondary-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`h-0.5 w-16 mx-2 ${
                  step < currentStep ? 'bg-primary-600' : 'bg-secondary-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Campaign Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter campaign name"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Campaign Type
              </label>
              <div className="grid grid-cols-1 gap-3">
                {campaignTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-border-primary hover:border-primary-300'
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                        formData.type === type.value
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-secondary-300'
                      }`}>
                        {formData.type === type.value && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full m-0.5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{type.label}</h4>
                        <p className="text-sm text-text-secondary">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Subject Line
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter email subject line"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Template
              </label>
              {filteredTemplates.length > 0 ? (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.template === template.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-border-primary hover:border-primary-300'
                      }`}
                      onClick={() => handleInputChange('template', template.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.template === template.id
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-secondary-300'
                        }`}>
                          {formData.template === template.id && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-text-primary">{template.name}</h4>
                          <p className="text-sm text-text-secondary">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No templates available for this campaign type.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Recipients */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Target Audience
              </h3>
              <p className="text-text-secondary mb-4">
                Select homeowner segments to target with this campaign
              </p>
            </div>

            <div className="space-y-3">
              {homeownerSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSegments.includes(segment.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-border-primary hover:border-primary-300'
                  }`}
                  onClick={() => handleSegmentToggle(segment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-5 h-5 rounded border-2 mt-1 flex items-center justify-center ${
                        selectedSegments.includes(segment.id)
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-secondary-300'
                      }`}>
                        {selectedSegments.includes(segment.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{segment.name}</h4>
                        <p className="text-sm text-text-secondary">{segment.description}</p>
                        <p className="text-xs text-text-tertiary mt-1">{segment.criteria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-text-primary">{segment.count}</span>
                      <p className="text-xs text-text-tertiary">recipients</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedSegments.length > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-primary-800">Selected Segments</h4>
                    <p className="text-sm text-primary-600">
                      {selectedSegments.length} segment{selectedSegments.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">{totalRecipients}</span>
                    <p className="text-sm text-primary-600">total recipients</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule & Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Schedule Campaign
              </h3>
              <p className="text-text-secondary mb-4">
                Choose when to send your campaign
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="send_now"
                  name="schedule"
                  className="w-4 h-4 text-primary-600"
                  defaultChecked
                />
                <label htmlFor="send_now" className="text-text-primary">
                  Send immediately
                </label>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="schedule_later"
                  name="schedule"
                  className="w-4 h-4 text-primary-600"
                />
                <label htmlFor="schedule_later" className="text-text-primary">
                  Schedule for later
                </label>
              </div>
              
              <div className="ml-8">
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Campaign Summary */}
            <div className="bg-background-secondary rounded-lg p-6 space-y-4">
              <h4 className="font-medium text-text-primary">Campaign Summary</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-tertiary">Name:</span>
                  <p className="text-text-primary font-medium">{formData.name || 'Untitled Campaign'}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Type:</span>
                  <p className="text-text-primary font-medium capitalize">
                    {formData.type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-text-tertiary">Subject:</span>
                  <p className="text-text-primary font-medium">{formData.subject || 'No subject'}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Recipients:</span>
                  <p className="text-text-primary font-medium">{totalRecipients} people</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div>
            {currentStep > 1 && (
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.subject || !formData.template)) ||
                  (currentStep === 2 && selectedSegments.length === 0)
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CampaignModal;