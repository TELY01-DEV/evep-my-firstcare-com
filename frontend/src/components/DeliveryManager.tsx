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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  LocalShipping,
  Add,
  Edit,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  ExpandMore,
  Assessment,
  TrendingUp,
  TrendingDown,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface DeliveryManagerProps {
  schoolId?: string;
  onDeliveryCreated?: (delivery: any) => void;
  onDeliveryConfirmed?: (confirmation: any) => void;
}

interface Delivery {
  delivery_id: string;
  patient_id: string;
  patient_name: string;
  glasses_order_id: string;
  school_id: string;
  school_name: string;
  delivery_address: string;
  contact_person: string;
  contact_phone: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  delivery_instructions?: string;
  priority: string;
  status: string;
  delivery_notes?: string;
  recipient_signature?: string;
  delivery_confirmation?: boolean;
  created_by: string;
  created_by_name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DeliveryCreate {
  patient_id: string;
  glasses_order_id: string;
  school_id: string;
  delivery_address: string;
  contact_person: string;
  contact_phone: string;
  expected_delivery_date: string;
  delivery_instructions?: string;
  priority: string;
  notes?: string;
}

interface DeliveryConfirmation {
  delivery_id: string;
  confirmation_type: string;
  confirmation_date: string;
  recipient_name: string;
  recipient_phone: string;
  signature?: string;
  delivery_notes?: string;
  photos?: string[];
  notes?: string;
}

const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  schoolId,
  onDeliveryCreated,
  onDeliveryConfirmed
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data state
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [glassesOrderId, setGlassesOrderId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolId || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [priority, setPriority] = useState('');
  const [notes, setNotes] = useState('');

  // Confirmation form state
  const [confirmationType, setConfirmationType] = useState('');
  const [confirmationDate, setConfirmationDate] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [confirmationNotes, setConfirmationNotes] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadDeliveries();
    loadUpcomingDeliveries();
    loadStatistics();
    loadPatients();
    loadSchools();
  }, [schoolId]);

  const loadDeliveries = async () => {
    try {
      const url = schoolId 
        ? `/api/v1/deliveries/school/${schoolId}`
        : '/api/v1/deliveries';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(response.data || []);
    } catch (err: any) {
      setError('Failed to load deliveries');
    }
  };

  const loadUpcomingDeliveries = async () => {
    try {
      const response = await axios.get('/api/v1/deliveries/upcoming?days=7', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingDeliveries(response.data.upcoming_deliveries || []);
    } catch (err: any) {
      setError('Failed to load upcoming deliveries');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get('/api/v1/deliveries/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (err: any) {
      setError('Failed to load statistics');
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/v1/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data.patients || []);
    } catch (err: any) {
      setError('Failed to load patients');
    }
  };

  const loadSchools = async () => {
    try {
      const response = await axios.get('/api/v1/evep/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchools(response.data.schools || []);
    } catch (err: any) {
      setError('Failed to load schools');
    }
  };

  const handleCreateDelivery = async () => {
    if (!patientId || !glassesOrderId || !selectedSchoolId || !deliveryAddress || !contactPerson || !contactPhone || !expectedDeliveryDate || !priority) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deliveryData: DeliveryCreate = {
        patient_id: patientId,
        glasses_order_id: glassesOrderId,
        school_id: selectedSchoolId,
        delivery_address: deliveryAddress,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        expected_delivery_date: expectedDeliveryDate,
        delivery_instructions: deliveryInstructions || undefined,
        priority: priority,
        notes: notes || undefined
      };

      const response = await axios.post(
        '/api/v1/deliveries',
        deliveryData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Delivery created successfully!');
      setShowCreateForm(false);
      resetCreateForm();
      loadDeliveries();
      loadUpcomingDeliveries();
      loadStatistics();
      if (onDeliveryCreated) {
        onDeliveryCreated(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedDelivery || !confirmationType || !confirmationDate || !recipientName || !recipientPhone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const confirmationData: DeliveryConfirmation = {
        delivery_id: selectedDelivery.delivery_id,
        confirmation_type: confirmationType,
        confirmation_date: confirmationDate,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivery_notes: confirmationNotes || undefined,
        notes: confirmationNotes || undefined
      };

      const response = await axios.post(
        `/api/v1/deliveries/${selectedDelivery.delivery_id}/confirm`,
        confirmationData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Delivery confirmed successfully!');
      setShowConfirmationForm(false);
      resetConfirmationForm();
      loadDeliveries();
      loadUpcomingDeliveries();
      loadStatistics();
      if (onDeliveryConfirmed) {
        onDeliveryConfirmed(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to confirm delivery');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setPatientId('');
    setGlassesOrderId('');
    setSelectedSchoolId(schoolId || '');
    setDeliveryAddress('');
    setContactPerson('');
    setContactPhone('');
    setExpectedDeliveryDate('');
    setDeliveryInstructions('');
    setPriority('');
    setNotes('');
  };

  const resetConfirmationForm = () => {
    setConfirmationType('');
    setConfirmationDate('');
    setRecipientName('');
    setRecipientPhone('');
    setConfirmationNotes('');
    setSelectedDelivery(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'in_transit':
        return 'warning';
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal':
        return 'success';
      case 'urgent':
        return 'warning';
      case 'emergency':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total Deliveries
              </Typography>
              <Typography variant="h4">
                {statistics?.total_deliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                On Time
              </Typography>
              <Typography variant="h4">
                {statistics?.on_time_deliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                Delayed
              </Typography>
              <Typography variant="h4">
                {statistics?.delayed_deliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Success Rate
              </Typography>
              <Typography variant="h4">
                {Math.round(statistics?.delivery_success_rate || 0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Deliveries Alert */}
      {upcomingDeliveries.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Upcoming Deliveries: {upcomingDeliveries.length} deliveries in the next 7 days
          </Typography>
          <List dense>
            {upcomingDeliveries.slice(0, 3).map((delivery) => (
              <ListItem key={delivery.delivery_id}>
                <ListItemIcon>
                  <Schedule color="info" />
                </ListItemIcon>
                <ListItemText
                  primary={`${delivery.patient_name} - ${delivery.school_name}`}
                  secondary={`Expected: ${formatDate(delivery.expected_delivery_date)} | Priority: ${delivery.priority}`}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateForm(true)}
        >
          Create Delivery
        </Button>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => {
            loadDeliveries();
            loadUpcomingDeliveries();
            loadStatistics();
          }}
        >
          Refresh Data
        </Button>
      </Box>

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

      {/* Deliveries Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
            Deliveries
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>School</TableCell>
                  <TableCell>Expected Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.delivery_id}>
                    <TableCell>{delivery.patient_name}</TableCell>
                    <TableCell>{delivery.school_name}</TableCell>
                    <TableCell>{formatDate(delivery.expected_delivery_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={delivery.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(delivery.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={delivery.priority.toUpperCase()}
                        color={getPriorityColor(delivery.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {delivery.contact_person}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {delivery.contact_phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {delivery.status === 'scheduled' || delivery.status === 'in_transit' ? (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowConfirmationForm(true);
                          }}
                        >
                          <CheckCircle />
                        </IconButton>
                      ) : (
                        <IconButton size="small" disabled>
                          <CheckCircle />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Delivery Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Delivery</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Patient</InputLabel>
                <Select value={patientId} label="Patient" onChange={(e) => setPatientId(e.target.value)}>
                  {patients.map((patient) => (
                    <MenuItem key={patient._id} value={patient._id}>
                      {patient.first_name} {patient.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Glasses Order ID"
                value={glassesOrderId}
                onChange={(e) => setGlassesOrderId(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>School</InputLabel>
                <Select value={selectedSchoolId} label="School" onChange={(e) => setSelectedSchoolId(e.target.value)}>
                  {schools.map((school) => (
                    <MenuItem key={school._id} value={school._id}>
                      {school.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Delivery Date"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Instructions"
                multiline
                rows={3}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateForm(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDelivery}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Creating...' : 'Create Delivery'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Confirmation Dialog */}
      <Dialog open={showConfirmationForm} onClose={() => setShowConfirmationForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delivery</DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1">
                Patient: {selectedDelivery.patient_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                School: {selectedDelivery.school_name} | Expected: {formatDate(selectedDelivery.expected_delivery_date)}
              </Typography>
            </Paper>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Confirmation Type</InputLabel>
                <Select value={confirmationType} label="Confirmation Type" onChange={(e) => setConfirmationType(e.target.value)}>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="rescheduled">Rescheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmation Date"
                type="date"
                value={confirmationDate}
                onChange={(e) => setConfirmationDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient Name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient Phone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Notes"
                multiline
                rows={3}
                value={confirmationNotes}
                onChange={(e) => setConfirmationNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmationForm(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelivery}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Confirming...' : 'Confirm Delivery'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryManager;
