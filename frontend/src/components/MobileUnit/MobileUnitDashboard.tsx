import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  Approval,
  Analytics,
  Notifications
} from '@mui/icons-material';

import MobileUnitCoordinator from './MobileUnitCoordinator';
import ApprovalWorkflow from './ApprovalWorkflow';
import { useAuth } from '../../contexts/AuthContext';
import unifiedApi from '../../services/unifiedApi';

interface MobileUnitDashboardProps {
  unitId?: string;
}

const MobileUnitDashboard: React.FC<MobileUnitDashboardProps> = ({
  unitId = 'mobile_unit_001'
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    // Fetch pending approvals count
    fetchPendingApprovals();
    
    // Set up real-time updates (WebSocket would be ideal here)
    const interval = setInterval(() => {
      fetchPendingApprovals();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/mobile-unit/pending-approvals');
      if (response.data.success) {
        setPendingApprovals(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    }
  };

  const handleNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <MobileUnitCoordinator 
            unitId={unitId}
            onNotification={handleNotification}
          />
        );
      case 1:
        return (
          <Box p={3}>
            <ApprovalWorkflow
              open={true}
              onClose={() => {}}
              sessionId=""
              sessionData={{}}
              mode="approve"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  // Role-based tab visibility
  const canManageApprovals = user?.role === 'doctor' || user?.role === 'medical_admin';

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="Mobile Unit Dashboard Tabs"
        >
          <Tab 
            icon={<Dashboard />} 
            label="Coordinator" 
            iconPosition="start"
          />
          
          {canManageApprovals && (
            <Tab 
              icon={
                <Badge badgeContent={pendingApprovals} color="error">
                  <Approval />
                </Badge>
              } 
              label="Approvals" 
              iconPosition="start"
            />
          )}
          
          <Tab 
            icon={<Analytics />} 
            label="Analytics" 
            iconPosition="start"
            disabled
          />
        </Tabs>
      </Box>

      {renderTabContent()}

      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
      >
        <Alert severity="info" onClose={() => setShowNotification(false)}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileUnitDashboard;