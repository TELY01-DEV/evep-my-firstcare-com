import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Warning,
  Schedule,
  Person,
  School,
  Send,
  History
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import unifiedApi from '../services/unifiedApi';

interface LineNotificationManagerProps {
  appointmentId?: string;
  onNotificationSent?: (notification: any) => void;
}

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  parent_id: string;
}

interface Parent {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  line_user_id?: string;
}

interface NotificationTemplate {
  template_id: string;
  template_name: string;
  template_type: string;
  subject: string;
  message_template: string;
  variables: string[];
}

interface ConsentRequest {
  consent_id: string;
  student_id: string;
  parent_id: string;
  appointment_id: string;
  consent_type: string;
  consent_details: string;
  status: string;
  response?: string;
  response_date?: string;
}

const LineNotificationManager: React.FC<LineNotificationManagerProps> = ({
  appointmentId,
  onNotificationSent
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);

  // UI state
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentType, setConsentType] = useState('');
  const [consentDetails, setConsentDetails] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadStudents();
    loadParents();
    loadTemplates();
    loadConsentRequests();
  }, []);

  // Load students and parents when appointment changes
  useEffect(() => {
    if (appointmentId) {
      loadStudents();
      loadParents();
    }
  }, [appointmentId]);

  const loadStudents = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/evep/students');
      setStudents(response.data.students || []);
    } catch (err: any) {
      setError('Failed to load students');
    }
  };

  const loadParents = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/evep/parents');
      setParents(response.data.parents || []);
    } catch (err: any) {
      setError('Failed to load parents');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/notifications/templates');
      setTemplates(response.data || []);
    } catch (err: any) {
      setError('Failed to load notification templates');
    }
  };

  const loadConsentRequests = async () => {
    try {
      const response = await unifiedApi.get('/api/v1/consent/requests');
      setConsentRequests(response.data || []);
    } catch (err: any) {
      setError('Failed to load consent requests');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedStudent || !selectedParent || !notificationType || (!messageTemplate && !customMessage)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const notificationData = {
        student_id: selectedStudent,
        parent_id: selectedParent,
        appointment_id: appointmentId || '',
        notification_type: notificationType,
        message_template: customMessage || messageTemplate
      };

      const response = await unifiedApi.post(
        '/api/v1/notifications/line/send',
        notificationData
      );

      setSuccess('Notification sent successfully!');
      if (onNotificationSent) {
        onNotificationSent(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSendConsentRequest = async () => {
    if (!selectedStudent || !selectedParent || !consentType || !consentDetails) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const consentData = {
        student_id: selectedStudent,
        parent_id: selectedParent,
        appointment_id: appointmentId || '',
        consent_type: consentType,
        consent_details: consentDetails
      };

      const response = await unifiedApi.post(
        '/api/v1/notifications/line/send-consent',
        consentData
      );

      setSuccess('Consent request sent successfully!');
      setShowConsentDialog(false);
      loadConsentRequests();
      if (onNotificationSent) {
        onNotificationSent(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send consent request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'responded':
        return 'success';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'approved':
        return 'success';
      case 'declined':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
            LINE Notification Manager
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Student Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  label="Select Student"
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.first_name} {student.last_name} ({student.student_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Parent Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Parent</InputLabel>
                <Select
                  value={selectedParent}
                  label="Select Parent"
                  onChange={(e) => setSelectedParent(e.target.value)}
                >
                  {parents.map((parent) => (
                    <MenuItem key={parent._id} value={parent._id}>
                      {parent.first_name} {parent.last_name} {parent.line_user_id ? '(LINE Connected)' : '(No LINE)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Notification Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Notification Type</InputLabel>
                <Select
                  value={notificationType}
                  label="Notification Type"
                  onChange={(e) => setNotificationType(e.target.value)}
                >
                  <MenuItem value="reminder">Appointment Reminder</MenuItem>
                  <MenuItem value="results">Screening Results</MenuItem>
                  <MenuItem value="follow_up">Follow-up Information</MenuItem>
                  <MenuItem value="general">General Information</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Template Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Message Template</InputLabel>
                <Select
                  value={messageTemplate}
                  label="Message Template"
                  onChange={(e) => setMessageTemplate(e.target.value)}
                >
                  <MenuItem value="">Custom Message</MenuItem>
                  {templates
                    .filter(template => template.template_type === notificationType || !notificationType)
                    .map((template) => (
                      <MenuItem key={template.template_id} value={template.message_template}>
                        {template.template_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Message */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message Content"
                multiline
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message here..."
                disabled={!!messageTemplate}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSendNotification}
                  disabled={loading || !selectedStudent || !selectedParent || !notificationType || (!messageTemplate && !customMessage)}
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowConsentDialog(true)}
                  disabled={loading || !selectedStudent || !selectedParent}
                  startIcon={<CheckCircle />}
                >
                  Send Consent Request
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Consent Requests History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <History sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consent Requests History
          </Typography>

          <List>
            {consentRequests.map((consent) => (
              <React.Fragment key={consent.consent_id}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={getResponseColor(consent.response || '') as any} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${consent.consent_type.replace('_', ' ').toUpperCase()} - ${consent.status}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Student: {students.find(s => s._id === consent.student_id)?.first_name} {students.find(s => s._id === consent.student_id)?.last_name}
                        </Typography>
                        <Typography variant="body2">
                          Parent: {parents.find(p => p._id === consent.parent_id)?.first_name} {parents.find(p => p._id === consent.parent_id)?.last_name}
                        </Typography>
                        <Typography variant="body2">
                          Details: {consent.consent_details}
                        </Typography>
                        {consent.response && (
                          <Chip
                            label={consent.response.toUpperCase()}
                            color={getResponseColor(consent.response) as any}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                        {consent.response_date && (
                          <Typography variant="caption" display="block">
                            Responded: {new Date(consent.response_date).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Consent Request Dialog */}
      <Dialog open={showConsentDialog} onClose={() => setShowConsentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Consent Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Consent Type</InputLabel>
                <Select
                  value={consentType}
                  label="Consent Type"
                  onChange={(e) => setConsentType(e.target.value)}
                >
                  <MenuItem value="screening">Eye Screening Consent</MenuItem>
                  <MenuItem value="treatment">Treatment Consent</MenuItem>
                  <MenuItem value="data_sharing">Data Sharing Consent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Consent Details"
                multiline
                rows={4}
                value={consentDetails}
                onChange={(e) => setConsentDetails(e.target.value)}
                placeholder="Provide detailed information about what the parent is consenting to..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConsentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendConsentRequest}
            variant="contained"
            disabled={loading || !consentType || !consentDetails}
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          >
            {loading ? 'Sending...' : 'Send Consent Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LineNotificationManager;
