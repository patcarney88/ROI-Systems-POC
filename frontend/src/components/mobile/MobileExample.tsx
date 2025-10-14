/**
 * Mobile Components Example
 * Demonstrates usage of all mobile UI components
 */

import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import {
  BottomNavigation,
  BottomNavSpacer,
  MobileHeader,
  PullToRefresh,
  MobileAlertCard,
  MobileDocumentViewer,
  BottomSheet,
  SnapPoint,
  MobileModal,
  MobileButton,
  MobileTextField,
  MobileSelect
} from './index';
import type { Alert } from '../../types/alert.types';

/**
 * Example: Mobile Alert List with Pull-to-Refresh
 */
export const MobileAlertListExample: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Fetch new alerts
    const newAlerts = await fetchAlerts();
    setAlerts(newAlerts);
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'ACKNOWLEDGED' as const }
          : alert
      )
    );
  };

  const handleContact = (alertId: string, method: 'phone' | 'email') => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    if (method === 'phone' && alert.user.phone) {
      window.location.href = `tel:${alert.user.phone}`;
    } else if (method === 'email') {
      window.location.href = `mailto:${alert.user.email}`;
    }
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'DISMISSED' as const }
          : alert
      )
    );
  };

  const handleViewDetails = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    setSelectedAlert(alert || null);
  };

  return (
    <>
      <MobileHeader
        title="Alerts"
        showSearch
        collapseOnScroll
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
          {alerts.map(alert => (
            <MobileAlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onContact={handleContact}
              onDismiss={handleDismiss}
              onTap={handleViewDetails}
              showSwipeActions
            />
          ))}
        </Container>
      </PullToRefresh>

      <BottomNavigation alertCount={alerts.length} />
      <BottomNavSpacer />

      {/* Alert Details Bottom Sheet */}
      <BottomSheet
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Alert Details"
        snapPoints={[SnapPoint.HALF, SnapPoint.FULL]}
      >
        {selectedAlert && (
          <Box p={2}>
            {/* Alert details content */}
            <pre>{JSON.stringify(selectedAlert, null, 2)}</pre>
          </Box>
        )}
      </BottomSheet>
    </>
  );
};

/**
 * Example: Mobile Document Gallery with Viewer
 */
export const MobileDocumentGalleryExample: React.FC = () => {
  const [documents] = useState([
    {
      id: '1',
      title: 'Purchase Agreement',
      url: '/docs/agreement.pdf',
      type: 'pdf' as const
    },
    {
      id: '2',
      title: 'Property Photo',
      url: '/images/property.jpg',
      type: 'image' as const
    }
  ]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleOpenViewer = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const handleDownload = (doc: any) => {
    // Trigger download
    window.open(doc.url, '_blank');
  };

  const handleShare = async (doc: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.title,
          url: doc.url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <>
      <MobileHeader
        title="Documents"
        showSearch
      />

      <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          {documents.map((doc, index) => (
            <Box
              key={doc.id}
              onClick={() => handleOpenViewer(index)}
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                '&:active': {
                  opacity: 0.7
                }
              }}
            >
              {doc.type === 'image' ? (
                <img
                  src={doc.url}
                  alt={doc.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  bgcolor="grey.100"
                >
                  📄
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Container>

      <MobileDocumentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documents={documents}
        initialIndex={selectedIndex}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      <BottomNavigation />
      <BottomNavSpacer />
    </>
  );
};

/**
 * Example: Mobile Form with Touch-Friendly Inputs
 */
export const MobileFormExample: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    priority: '',
    date: '',
    notes: ''
  });

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    setFormOpen(false);
  };

  return (
    <>
      <MobileHeader title="Contacts" />

      <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
        <MobileButton
          variant="contained"
          fullWidth
          onClick={() => setFormOpen(true)}
        >
          Add Contact
        </MobileButton>
      </Container>

      <MobileModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Contact"
        actions={
          <>
            <MobileButton
              variant="outlined"
              fullWidth
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              variant="contained"
              fullWidth
              onClick={handleSubmit}
            >
              Save
            </MobileButton>
          </>
        }
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <MobileTextField
            label="Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            onClear={() => setFormData({ ...formData, name: '' })}
          />

          <MobileTextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />

          <MobileTextField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />

          <MobileSelect
            label="Priority"
            value={formData.priority}
            onChange={e => setFormData({ ...formData, priority: e.target.value as string })}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' }
            ]}
          />

          <MobileTextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
          />

          <MobileTextField
            label="Notes"
            multiline
            rows={4}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </Box>
      </MobileModal>

      <BottomNavigation />
      <BottomNavSpacer />
    </>
  );
};

// Mock function for example
async function fetchAlerts(): Promise<Alert[]> {
  return [];
}

export default {
  MobileAlertListExample,
  MobileDocumentGalleryExample,
  MobileFormExample
};
