import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  IconButton,

  Paper,
  Stack,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  PersonAdd,
  Add,
  ExpandMore,
  CheckCircle,
  Warning,
  Delete,
  ContentCopy,
  Save,
  Preview,
  Settings,
  Message,
  Person,
  Gavel,
  PlayArrow,
  ViewModule as Template
} from '@mui/icons-material';
import { 
  getFollowFlows, 
  createFollowFlow, 
  updateFollowFlow, 
  deleteFollowFlow,
  handleFollowEvent,
  getLegalDocuments 
} from '../../api';

interface LegalDocument {
  id?: string;
  document_type: 'privacy_policy' | 'terms_of_use' | 'digital_consent';
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  effective_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface FollowEventFlow {
  id?: string;
  name: string;
  is_active: boolean;
  welcome_message: {
    text: string;
    include_quick_replies: boolean;
    quick_replies: string[];
  };
  onboarding_steps: Array<{
    step: number;
    type: 'text' | 'flex' | 'image' | 'video';
    content: any;
    delay_seconds: number;
    conditions?: any;
  }>;
  user_preferences: {
    collect_language: boolean;
    collect_timezone: boolean;
    collect_notifications: boolean;
    collect_medical_info: boolean;
  };
  consent_management: {
    require_consent: boolean;
    consent_text: string;
    privacy_policy_url: string;
    required_documents: string[];
    optional_documents: string[];
    consent_flow_type: 'simple' | 'detailed' | 'step_by_step';
  };
  profile_setup: {
    auto_create_profile: boolean;
    required_fields: string[];
    optional_fields: string[];
  };
}

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
      id={`flow-tabpanel-${index}`}
      aria-labelledby={`flow-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FollowEventManager: React.FC = () => {
  // Add template functionality
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [flows, setFlows] = useState<FollowEventFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FollowEventFlow | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  
  // Load flows and legal documents on component mount
  React.useEffect(() => {
    loadFlows();
    loadLegalDocuments();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const response = await getFollowFlows();
      setFlows(response.data || []);
    } catch (error: any) {
      console.error('Error loading flows:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load follow flows';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadLegalDocuments = async () => {
    try {
      const response = await getLegalDocuments();
      setLegalDocuments(response.data.documents || []);
    } catch (error: any) {
      console.error('Error loading legal documents:', error);
      // Don't set error state for legal documents as it's not critical
    }
  };

  const [formData, setFormData] = useState<FollowEventFlow>({
    name: '',
    is_active: true,
    welcome_message: {
      text: 'Welcome to DiaCare Buddy! 👋\n\nI\'m here to help you manage your diabetes care. Let\'s get started with a few quick questions.',
      include_quick_replies: true,
      quick_replies: ['Start Setup', 'Learn More', 'Skip Setup']
    },
    onboarding_steps: [
      {
        step: 1,
        type: 'text',
        content: { text: 'What language would you prefer to use?' },
        delay_seconds: 0
      },
      {
        step: 2,
        type: 'text',
        content: { text: 'Would you like to receive notifications about your health?' },
        delay_seconds: 2
      }
    ],
    user_preferences: {
      collect_language: true,
      collect_timezone: true,
      collect_notifications: true,
      collect_medical_info: false
    },
    consent_management: {
      require_consent: true,
      consent_text: 'By using this service, you agree to our privacy policy and terms of service.',
      privacy_policy_url: '/privacy',
      required_documents: ['privacy_policy', 'digital_consent'],
      optional_documents: ['terms_of_use'],
      consent_flow_type: 'step_by_step'
    },
    profile_setup: {
      auto_create_profile: true,
      required_fields: ['name', 'age'],
      optional_fields: ['medical_history', 'preferences']
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleOpenDialog = (flow?: FollowEventFlow) => {
    if (flow) {
      setEditingFlow(flow);
      setFormData(flow);
    } else {
      setEditingFlow(null);
      setFormData({
        name: '',
        is_active: true,
        welcome_message: {
          text: 'Welcome to DiaCare Buddy! 👋\n\nI\'m here to help you manage your diabetes care. Let\'s get started with a few quick questions.',
          include_quick_replies: true,
          quick_replies: ['Start Setup', 'Learn More', 'Skip Setup']
        },
        onboarding_steps: [
          {
            step: 1,
            type: 'text',
            content: { text: 'What language would you prefer to use?' },
            delay_seconds: 0
          },
          {
            step: 2,
            type: 'text',
            content: { text: 'Would you like to receive notifications about your health?' },
            delay_seconds: 2
          }
        ],
        user_preferences: {
          collect_language: true,
          collect_timezone: true,
          collect_notifications: true,
          collect_medical_info: false
        },
        consent_management: {
          require_consent: true,
          consent_text: 'By using this service, you agree to our privacy policy and terms of service.',
          privacy_policy_url: '/privacy',
          required_documents: ['privacy_policy', 'digital_consent'],
          optional_documents: ['terms_of_use'],
          consent_flow_type: 'step_by_step'
        },
        profile_setup: {
          auto_create_profile: true,
          required_fields: ['name', 'age'],
          optional_fields: ['medical_history', 'preferences']
        }
      });
    }
    setTabValue(0);
    setPreviewMode(false);
    setValidationErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFlow(null);
    setPreviewMode(false);
    setValidationErrors({});
  };

  const handleTemplateSelect = (templateName: string) => {
    loadTemplate(templateName);
    setTemplateDialogOpen(false);
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Flow name is required';
    }
    
    if (!formData.welcome_message.text.trim()) {
      errors.welcomeMessage = 'Welcome message is required';
    }
    
    if (formData.welcome_message.include_quick_replies && formData.welcome_message.quick_replies.length === 0) {
      errors.quickReplies = 'At least one quick reply is required when quick replies are enabled';
    }
    
    if (formData.onboarding_steps.length === 0) {
      errors.onboardingSteps = 'At least one onboarding step is required';
    }
    
    formData.onboarding_steps.forEach((step, index) => {
      if (!step.content?.text?.trim()) {
        errors[`step${index}Content`] = `Step ${index + 1} content is required`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingFlow) {
        // Update existing flow
        await updateFollowFlow(editingFlow.id!, formData);
        setSuccess('Follow event flow updated successfully!');
      } else {
        // Create new flow
        const response = await createFollowFlow(formData);
        setFlows(prev => [response.data, ...prev]);
        setSuccess('Follow event flow created successfully!');
      }
      
      handleCloseDialog();
    } catch (err: any) {
      console.error('Save flow error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save follow event flow';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestFlow = async (flow: FollowEventFlow) => {
    try {
      setLoading(true);
      setError(null);
      
      const testData = { user_id: 'test_user_123', flow_id: flow.id };
      console.log('Sending test data:', testData);
      
      // Test the flow with a dummy user ID
      await handleFollowEvent(testData);
      setSuccess('Follow event flow tested successfully!');
    } catch (err: any) {
      console.error('Test flow error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to test follow event flow';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlow = async (flow: FollowEventFlow) => {
    if (!window.confirm(`Are you sure you want to delete the flow "${flow.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await deleteFollowFlow(flow.id!);
      setFlows(prev => prev.filter(f => f.id !== flow.id));
      setSuccess('Follow event flow deleted successfully!');
    } catch (err: any) {
      console.error('Delete flow error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete follow event flow';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addOnboardingStep = () => {
    const newStep = {
      step: formData.onboarding_steps.length + 1,
      type: 'text' as const,
      content: { text: '' },
      delay_seconds: 0
    };
    setFormData(prev => ({
      ...prev,
      onboarding_steps: [...prev.onboarding_steps, newStep]
    }));
  };

  const removeOnboardingStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      onboarding_steps: prev.onboarding_steps.filter((_, i) => i !== index)
    }));
  };

  const updateOnboardingStep = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      onboarding_steps: prev.onboarding_steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const addQuickReply = () => {
    setFormData(prev => ({
      ...prev,
      welcome_message: {
        ...prev.welcome_message,
        quick_replies: [...prev.welcome_message.quick_replies, '']
      }
    }));
  };

  const updateQuickReply = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      welcome_message: {
        ...prev.welcome_message,
        quick_replies: prev.welcome_message.quick_replies.map((reply, i) => 
          i === index ? value : reply
        )
      }
    }));
  };

  const removeQuickReply = (index: number) => {
    setFormData(prev => ({
      ...prev,
      welcome_message: {
        ...prev.welcome_message,
        quick_replies: prev.welcome_message.quick_replies.filter((_, i) => i !== index)
      }
    }));
  };

  const loadTemplate = (templateName: string) => {
    const templates: {[key: string]: FollowEventFlow} = {
      'basic': {
        name: 'Basic Onboarding',
        is_active: true,
        welcome_message: {
          text: 'Welcome! Let\'s get you started with a few quick questions.',
          include_quick_replies: true,
          quick_replies: ['Start', 'Help', 'Skip']
        },
        onboarding_steps: [
          {
            step: 1,
            type: 'text',
            content: { text: 'What\'s your name?' },
            delay_seconds: 0
          },
          {
            step: 2,
            type: 'text',
            content: { text: 'How can we help you today?' },
            delay_seconds: 1
          }
        ],
        user_preferences: {
          collect_language: true,
          collect_timezone: true,
          collect_notifications: false,
          collect_medical_info: false
        },
        consent_management: {
          require_consent: true,
          consent_text: 'By continuing, you agree to our terms of service.',
          privacy_policy_url: '/privacy',
          required_documents: ['privacy_policy', 'digital_consent'],
          optional_documents: ['terms_of_use'],
          consent_flow_type: 'step_by_step'
        },
        profile_setup: {
          auto_create_profile: true,
          required_fields: ['name'],
          optional_fields: ['preferences']
        }
      },
      'medical': {
        name: 'Medical Onboarding',
        is_active: true,
        welcome_message: {
          text: 'Welcome to our health service! We\'ll help you set up your health profile.',
          include_quick_replies: true,
          quick_replies: ['Start Health Setup', 'Learn More', 'Contact Support']
        },
        onboarding_steps: [
          {
            step: 1,
            type: 'text',
            content: { text: 'What\'s your primary health concern?' },
            delay_seconds: 0
          },
          {
            step: 2,
            type: 'text',
            content: { text: 'Do you have any existing medical conditions?' },
            delay_seconds: 2
          },
          {
            step: 3,
            type: 'text',
            content: { text: 'What medications are you currently taking?' },
            delay_seconds: 2
          }
        ],
        user_preferences: {
          collect_language: true,
          collect_timezone: true,
          collect_notifications: true,
          collect_medical_info: true
        },
        consent_management: {
          require_consent: true,
          consent_text: 'By using this health service, you consent to sharing your health information for medical purposes.',
          privacy_policy_url: '/health-privacy',
          required_documents: ['privacy_policy', 'digital_consent'],
          optional_documents: ['terms_of_use'],
          consent_flow_type: 'step_by_step'
        },
        profile_setup: {
          auto_create_profile: true,
          required_fields: ['name', 'age', 'medical_history'],
          optional_fields: ['emergency_contact', 'preferences']
        }
      }
    };

    if (templates[templateName]) {
      setFormData(templates[templateName]);
      setSuccess(`Loaded ${templateName} template`);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
            <PersonAdd sx={{ fontSize: 28, color: 'white' }} />
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
              Visual Follow Event Manager
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Template-based onboarding flow management
            </Typography>
          </Box>
        </Box>
        <Chip label="Template-Based" color="primary" variant="outlined" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' ? error : 'An error occurred'}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {typeof success === 'string' ? success : 'Operation completed successfully'}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Onboarding Flows ({flows.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Template />}
            onClick={() => setTemplateDialogOpen(true)}
            disabled={loading}
          >
            Choose Template
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Create Custom Flow
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {(flows || []).map((flow, index) => (
          <Grid item xs={12} key={flow?.id || `flow-${index}`}>
            <Card sx={{ 
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {flow.name || 'Unnamed Flow'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flow.onboarding_steps?.length || 0} onboarding steps
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={flow.is_active ? 'Active' : 'Inactive'}
                      color={flow.is_active ? 'success' : 'default'}
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleTestFlow(flow)}
                    >
                      Test Flow
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenDialog(flow)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteFlow(flow)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">Flow Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Welcome Message
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {flow.welcome_message?.text || 'No welcome message configured'}
                        </Typography>
                        {flow.welcome_message?.include_quick_replies && flow.welcome_message?.quick_replies && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {(flow.welcome_message?.quick_replies || []).map((reply, i) => (
                              <Chip key={i} label={reply} size="small" />
                            ))}
                          </Box>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          User Preferences Collection
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              {flow.user_preferences?.collect_language ? <CheckCircle color="success" /> : <Warning color="disabled" />}
                            </ListItemIcon>
                            <ListItemText primary="Language Preference" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              {flow.user_preferences?.collect_timezone ? <CheckCircle color="success" /> : <Warning color="disabled" />}
                            </ListItemIcon>
                            <ListItemText primary="Timezone" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              {flow.user_preferences?.collect_notifications ? <CheckCircle color="success" /> : <Warning color="disabled" />}
                            </ListItemIcon>
                            <ListItemText primary="Notification Settings" />
                          </ListItem>
                        </List>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Template />
            <Typography variant="h6">Choose a Template</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a pre-built template to get started quickly, or create a custom flow from scratch.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleTemplateSelect('basic')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PersonAdd color="primary" />
                    <Typography variant="h6">
                      Basic Welcome Flow
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Simple welcome message with basic onboarding
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Template" size="small" variant="outlined" />
                    <Chip label="Ready to Use" size="small" color="success" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleTemplateSelect('medical')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PersonAdd color="error" />
                    <Typography variant="h6">
                      Medical Onboarding
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Comprehensive health profile setup
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Template" size="small" variant="outlined" />
                    <Chip label="Health Focused" size="small" color="error" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingFlow ? 'Edit Onboarding Flow' : 'Create New Onboarding Flow'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Preview />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Edit Mode' : 'Preview'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => loadTemplate('basic')}
              >
                Load Template
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {previewMode ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Flow Preview</Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Welcome Message:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {formData.welcome_message.text}
                </Typography>
                {formData.welcome_message.include_quick_replies && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {formData.welcome_message.quick_replies.map((reply, i) => (
                      <Chip key={i} label={reply} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Paper>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Onboarding Steps:
              </Typography>
              {formData.onboarding_steps.map((step, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Step {step.step} ({step.type})
                  </Typography>
                  <Typography variant="body2">
                    {step.content?.text}
                  </Typography>
                  {step.delay_seconds > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Delay: {step.delay_seconds}s
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="flow configuration tabs">
                  <Tab icon={<Message />} label="Welcome" />
                  <Tab icon={<PlayArrow />} label="Onboarding" />
                  <Tab icon={<Person />} label="Preferences" />
                  <Tab icon={<Gavel />} label="Consent" />
                  <Tab icon={<Settings />} label="Profile" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Flow Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    helperText="Enter a descriptive name for this onboarding flow"
                    error={!!validationErrors.name}
                    FormHelperTextProps={{ error: !!validationErrors.name }}
                  />
                  {validationErrors.name && (
                    <FormHelperText error>{validationErrors.name}</FormHelperText>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Welcome Message"
                    multiline
                    rows={4}
                    value={formData.welcome_message.text}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      welcome_message: { ...prev.welcome_message, text: e.target.value }
                    }))}
                    helperText="Message sent to new users when they follow the bot"
                    error={!!validationErrors.welcomeMessage}
                    FormHelperTextProps={{ error: !!validationErrors.welcomeMessage }}
                  />
                  {validationErrors.welcomeMessage && (
                    <FormHelperText error>{validationErrors.welcomeMessage}</FormHelperText>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.welcome_message.include_quick_replies}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          welcome_message: { ...prev.welcome_message, include_quick_replies: e.target.checked }
                        }))}
                      />
                    }
                    label="Include Quick Reply Buttons"
                  />
                </Grid>

                {formData.welcome_message.include_quick_replies && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Reply Buttons
                    </Typography>
                    <Stack spacing={2}>
                      {formData.welcome_message.quick_replies.map((reply, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`Quick Reply ${index + 1}`}
                            value={reply}
                            onChange={(e) => updateQuickReply(index, e.target.value)}
                            placeholder="Enter quick reply text"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeQuickReply(index)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addQuickReply}
                        size="small"
                      >
                        Add Quick Reply
                      </Button>
                    </Stack>
                    {validationErrors.quickReplies && (
                      <FormHelperText error>{validationErrors.quickReplies}</FormHelperText>
                    )}
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Onboarding Steps</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={addOnboardingStep}
                    >
                      Add Step
                    </Button>
                  </Box>
                </Grid>

                {(formData.onboarding_steps || []).map((step, index) => (
                  <Grid item xs={12} key={`step-${index}`}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle1">Step {step.step}</Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeOnboardingStep(index)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Message Type</InputLabel>
                              <Select
                                value={step.type}
                                onChange={(e) => updateOnboardingStep(index, 'type', e.target.value)}
                                label="Message Type"
                              >
                                <MenuItem value="text">Text Message</MenuItem>
                                <MenuItem value="flex">Flex Message</MenuItem>
                                <MenuItem value="image">Image</MenuItem>
                                <MenuItem value="video">Video</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Delay (seconds)"
                              type="number"
                              value={step.delay_seconds}
                              onChange={(e) => updateOnboardingStep(index, 'delay_seconds', parseInt(e.target.value) || 0)}
                              inputProps={{ min: 0 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                              }}
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Message Content"
                              multiline
                              rows={3}
                              value={typeof step.content === 'object' && step.content?.text ? step.content.text : ''}
                              onChange={(e) => updateOnboardingStep(index, 'content', { text: e.target.value })}
                              error={!!validationErrors[`step${index}Content`]}
                              helperText={validationErrors[`step${index}Content`] || "Enter the message content for this step"}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}

                {validationErrors.onboardingSteps && (
                  <Grid item xs={12}>
                    <FormHelperText error>{validationErrors.onboardingSteps}</FormHelperText>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>User Preferences Collection</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.user_preferences.collect_language}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          user_preferences: { ...prev.user_preferences, collect_language: e.target.checked }
                        }))}
                      />
                    }
                    label="Collect Language Preference"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.user_preferences.collect_timezone}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          user_preferences: { ...prev.user_preferences, collect_timezone: e.target.checked }
                        }))}
                      />
                    }
                    label="Collect Timezone"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.user_preferences.collect_notifications}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          user_preferences: { ...prev.user_preferences, collect_notifications: e.target.checked }
                        }))}
                      />
                    }
                    label="Collect Notification Settings"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.user_preferences.collect_medical_info}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          user_preferences: { ...prev.user_preferences, collect_medical_info: e.target.checked }
                        }))}
                      />
                    }
                    label="Collect Medical Information"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Consent Management</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure consent collection using Legal Document Manager
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.consent_management.require_consent}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          consent_management: { ...prev.consent_management, require_consent: e.target.checked }
                        }))}
                      />
                    }
                    label="Require User Consent"
                  />
                </Grid>

                {formData.consent_management.require_consent && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Consent Flow Type</InputLabel>
                        <Select
                          value={formData.consent_management.consent_flow_type}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            consent_management: { ...prev.consent_management, consent_flow_type: e.target.value as 'simple' | 'detailed' | 'step_by_step' }
                          }))}
                          label="Consent Flow Type"
                        >
                          <MenuItem value="simple">Simple (Single Consent)</MenuItem>
                          <MenuItem value="detailed">Detailed (All Documents)</MenuItem>
                          <MenuItem value="step_by_step">Step by Step (Progressive)</MenuItem>
                        </Select>
                        <FormHelperText>
                          How consent documents will be presented to users
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Required Documents</InputLabel>
                        <Select
                          multiple
                          value={formData.consent_management.required_documents}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            consent_management: { ...prev.consent_management, required_documents: e.target.value as string[] }
                          }))}
                          label="Required Documents"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {legalDocuments.filter(doc => doc.is_active).map((doc) => (
                            <MenuItem key={doc.document_type} value={doc.document_type}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{doc.title}</Typography>
                                <Chip label={`v${doc.version}`} size="small" variant="outlined" />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          Documents that users must consent to (from Legal Document Manager)
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Optional Documents</InputLabel>
                        <Select
                          multiple
                          value={formData.consent_management.optional_documents}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            consent_management: { ...prev.consent_management, optional_documents: e.target.value as string[] }
                          }))}
                          label="Optional Documents"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {legalDocuments.filter(doc => doc.is_active).map((doc) => (
                            <MenuItem key={doc.document_type} value={doc.document_type}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{doc.title}</Typography>
                                <Chip label={`v${doc.version}`} size="small" variant="outlined" />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          Documents that users can optionally consent to
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Consent Text"
                        multiline
                        rows={3}
                        value={formData.consent_management.consent_text}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          consent_management: { ...prev.consent_management, consent_text: e.target.value }
                        }))}
                        helperText="Additional consent text shown to users (optional)"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Legal Document Integration:</strong> This flow will use documents from the Legal Document Manager. 
                          Make sure you have created the required documents in the Legal Documents section.
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 1 }}
                          onClick={() => window.open('/admin/legal-documents', '_blank')}
                        >
                          Open Legal Document Manager
                        </Button>
                      </Alert>
                    </Grid>

                    {/* Consent Flow Preview */}
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Consent Flow Preview
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">
                              Flow Type: {formData.consent_management.consent_flow_type.replace('_', ' ').toUpperCase()}
                            </Typography>
                          </Box>
                          
                          {formData.consent_management.required_documents.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="error" gutterBottom>
                                Required Documents ({formData.consent_management.required_documents.length}):
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.consent_management.required_documents.map((docType) => {
                                  const doc = legalDocuments.find(d => d.document_type === docType);
                                  return (
                                    <Chip 
                                      key={docType} 
                                      label={doc ? doc.title : docType} 
                                      color="error" 
                                      variant="outlined"
                                      size="small"
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          )}

                          {formData.consent_management.optional_documents.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                Optional Documents ({formData.consent_management.optional_documents.length}):
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.consent_management.optional_documents.map((docType) => {
                                  const doc = legalDocuments.find(d => d.document_type === docType);
                                  return (
                                    <Chip 
                                      key={docType} 
                                      label={doc ? doc.title : docType} 
                                      color="warning" 
                                      variant="outlined"
                                      size="small"
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          )}

                          {formData.consent_management.required_documents.length === 0 && 
                           formData.consent_management.optional_documents.length === 0 && (
                            <Alert severity="warning">
                              No documents selected. Please select at least one document from the Legal Document Manager.
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Profile Setup</Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.profile_setup.auto_create_profile}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          profile_setup: { ...prev.profile_setup, auto_create_profile: e.target.checked }
                        }))}
                      />
                    }
                    label="Auto-create User Profile"
                  />
                </Grid>

                {formData.profile_setup.auto_create_profile && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Required Fields</Typography>
                      <TextField
                        fullWidth
                        label="Required Fields (comma-separated)"
                        value={formData.profile_setup.required_fields.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          profile_setup: { 
                            ...prev.profile_setup, 
                            required_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                          }
                        }))}
                        helperText="Fields that must be filled (e.g., name, age, email)"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Optional Fields</Typography>
                      <TextField
                        fullWidth
                        label="Optional Fields (comma-separated)"
                        value={formData.profile_setup.optional_fields.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          profile_setup: { 
                            ...prev.profile_setup, 
                            optional_fields: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                          }
                        }))}
                        helperText="Fields that can be filled later (e.g., preferences, notes)"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </TabPanel>
          </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || !formData.name}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {loading ? 'Saving...' : 'Save Flow'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {typeof success === 'string' ? success : 'Operation completed successfully'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FollowEventManager;
