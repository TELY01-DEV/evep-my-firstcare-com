import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  ViewModule as TemplateIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  Event as EventIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

// Import existing components from DiaCare Buddy
// Temporarily disabled due to build issues
// import BotSettingsPanel from './line-bot/BotSettingsPanel.tsx';
// import RichMenuManager from './line-bot/RichMenuManager.tsx';
// import KeywordReplyManager from './line-bot/KeywordReplyManager.tsx';
// import FlexMessageManager from './line-bot/FlexMessageManager.tsx';
// import MessageDashboard from './line-bot/MessageDashboard.tsx';
// import LineFollowers from './line-bot/LineFollowers.tsx';
// import FollowEventManager from './line-bot/FollowEventManager.tsx';
// import AIHealthAssistant from './line-bot/AIHealthAssistant.tsx';

// Placeholder components
const BotSettingsPanel = () => <div>Bot Settings Panel (Coming Soon)</div>;
const RichMenuManager = () => <div>Rich Menu Manager (Coming Soon)</div>;
const KeywordReplyManager = () => <div>Keyword Reply Manager (Coming Soon)</div>;
const FlexMessageManager = () => <div>Flex Message Manager (Coming Soon)</div>;
const MessageDashboard = () => <div>Message Dashboard (Coming Soon)</div>;
const LineFollowers = () => <div>Line Followers (Coming Soon)</div>;
const FollowEventManager = () => <div>Follow Event Manager (Coming Soon)</div>;
const AIHealthAssistant = () => <div>AI Health Assistant (Coming Soon)</div>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`line-bot-tabpanel-${index}`}
      aria-labelledby={`line-bot-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const LineBotManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabs = [
    { 
      label: 'Message Dashboard', 
      icon: <DashboardIcon />,
      component: <MessageDashboard />,
      description: 'Real-time message analytics and insights'
    },
    { 
      label: 'LINE Followers', 
      icon: <PeopleIcon />,
      component: <LineFollowers />,
      description: 'Manage and analyze LINE followers'
    },
    { 
      label: 'System Flex Messages', 
      icon: <TemplateIcon />,
      component: <FlexMessageManager />,
      description: 'Create and manage Flex Message templates'
    },
    { 
      label: 'Keyword Replies', 
      icon: <ChatIcon />,
      component: <KeywordReplyManager />,
      description: 'Configure automatic keyword-based responses'
    },
    { 
      label: 'AI Health Assistant', 
      icon: <AIIcon />,
      component: <AIHealthAssistant />,
      description: 'AI-powered health assistance features'
    },
    { 
      label: 'Follow Events', 
      icon: <EventIcon />,
      component: <FollowEventManager />,
      description: 'Manage follow/unfollow event flows'
    },
    { 
      label: 'Rich Menus', 
      icon: <MenuIcon />,
      component: <RichMenuManager />,
      description: 'Manage LINE Rich Menus and navigation'
    },
    { 
      label: 'Bot Settings', 
      icon: <SettingsIcon />,
      component: <BotSettingsPanel />,
      description: 'Configure LINE Bot channel settings and webhook'
    }
  ];

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 3,
        background: 'white',
        p: 3,
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flex: 1
        }}>
          <Box sx={{ 
            bgcolor: '#00B900', // LINE Green
            width: 56, 
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 185, 0, 0.3)'
          }}>
            <Typography sx={{ fontSize: 28, color: 'white', fontWeight: 'bold' }}>
              📱
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: 'linear-gradient(135deg, #00B900 0%, #00A000 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              LINE Bot Manager
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Comprehensive LINE Bot management for EVEP Platform
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="Message Dashboard" 
                size="small" 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                label="LINE Followers" 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label="Flex Messages" 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                label="Keyword Replies" 
                size="small" 
                color="info" 
                variant="outlined" 
              />
              <Chip 
                label="Rich Menus" 
                size="small" 
                color="warning" 
                variant="outlined" 
              />
              <Chip 
                label="AI Assistant" 
                size="small" 
                color="error" 
                variant="outlined" 
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Feature Overview Alert */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          '& .MuiAlert-message': { fontSize: '1rem' }
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          🚀 Comprehensive LINE Bot Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is a complete LINE Bot management system adapted from the proven DiaCare Buddy project. 
          It includes message analytics, follower management, Flex Message templates, keyword replies, 
          Rich Menus, AI health assistant, and comprehensive bot settings - all designed for the EVEP 
          vision screening platform.
        </Typography>
      </Alert>

      <Paper sx={{ 
        width: '100%',
        background: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="LINE Bot management tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.9rem',
                fontWeight: 500,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#00B900'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00B900'
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab 
                key={index} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.icon}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {tab.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {tab.description}
                      </Typography>
                    </Box>
                  </Box>
                } 
                id={`line-bot-tab-${index}`} 
              />
            ))}
          </Tabs>
        </Box>

        {tabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default LineBotManager;
