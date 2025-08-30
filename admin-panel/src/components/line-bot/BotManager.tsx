import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper
} from '@mui/material';
import BotSettingsPanel from './BotSettingsPanel';
import KeywordReplyManager from './KeywordReplyManager';
import AIHealthAssistant from './AIHealthAssistant';
import FollowEventManager from './FollowEventManager';
import MessageDashboard from './MessageDashboard';
import RichMenuManager from './RichMenuManager';
import FlexMessageManager from './FlexMessageManager';
import LineFollowers from './LineFollowers';

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
      id={`bot-tabpanel-${index}`}
      aria-labelledby={`bot-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BotManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabs = [
    { label: 'Message Dashboard', component: <MessageDashboard /> },
    { label: 'LINE Followers', component: <LineFollowers /> },
    { label: 'System Flex Messages', component: <FlexMessageManager /> },
    { label: 'Keyword Replies', component: <KeywordReplyManager /> },
    { label: 'AI Health Assistant', component: <AIHealthAssistant /> },
    { label: 'Follow Events', component: <FollowEventManager /> },
    { label: 'Rich Menus', component: <RichMenuManager /> },
    { label: 'Bot Settings', component: <BotSettingsPanel /> }
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
            bgcolor: 'primary.main', 
            width: 56, 
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)'
          }}>
            <Typography sx={{ fontSize: 28, color: 'white', fontWeight: 'bold' }}>
              🤖
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              LINE Bot Manager
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Manage your LINE Bot settings, keyword replies, AI health assistant, and message analytics
            </Typography>
          </Box>
        </Box>
      </Box>



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
            aria-label="bot management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} id={`bot-tab-${index}`} />
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

export default BotManager;
