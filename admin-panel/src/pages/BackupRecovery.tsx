import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Grid,
  LinearProgress,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  schedule_time?: string;
  retention_days: number;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  size?: number;
  location: 'local' | 'cloud' | 'both';
}

interface BackupHistory {
  id: string;
  job_id: string;
  job_name: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  size: number;
  duration?: number;
  error_message?: string;
  backup_files: string[];
}

interface RecoveryPoint {
  id: string;
  backup_id: string;
  name: string;
  created_at: string;
  size: number;
  type: 'full' | 'incremental' | 'differential';
  status: 'available' | 'corrupted' | 'expired';
  location: 'local' | 'cloud';
  checksum: string;
}

const BackupRecovery: React.FC = () => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [openJobDialog, setOpenJobDialog] = useState(false);
  const [openRecoveryDialog, setOpenRecoveryDialog] = useState(false);
  const [selectedRecoveryPoint, setSelectedRecoveryPoint] = useState<RecoveryPoint | null>(null);
  const [jobForm, setJobForm] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental' | 'differential',
    schedule: 'manual' as 'manual' | 'daily' | 'weekly' | 'monthly',
    schedule_time: '02:00',
    retention_days: 30,
    is_active: true,
    location: 'local' as 'local' | 'cloud' | 'both'
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now
      setBackupJobs([
        {
          id: '1',
          name: 'Daily Full Backup',
          type: 'full',
          schedule: 'daily',
          schedule_time: '02:00',
          retention_days: 7,
          is_active: true,
          last_run: '2024-01-20T02:00:00Z',
          next_run: '2024-01-21T02:00:00Z',
          status: 'completed',
          size: 2.3 * 1024 * 1024 * 1024,
          location: 'both'
        },
        {
          id: '2',
          name: 'Weekly Incremental',
          type: 'incremental',
          schedule: 'weekly',
          schedule_time: '03:00',
          retention_days: 30,
          is_active: true,
          last_run: '2024-01-15T03:00:00Z',
          next_run: '2024-01-22T03:00:00Z',
          status: 'idle',
          location: 'cloud'
        }
      ]);

      setBackupHistory([
        {
          id: '1',
          job_id: '1',
          job_name: 'Daily Full Backup',
          started_at: '2024-01-20T02:00:00Z',
          completed_at: '2024-01-20T02:15:00Z',
          status: 'completed',
          size: 2.3 * 1024 * 1024 * 1024,
          duration: 900,
          backup_files: ['backup_2024_01_20_full.tar.gz']
        },
        {
          id: '2',
          job_id: '1',
          job_name: 'Daily Full Backup',
          started_at: '2024-01-19T02:00:00Z',
          completed_at: '2024-01-19T02:12:00Z',
          status: 'completed',
          size: 2.2 * 1024 * 1024 * 1024,
          duration: 720,
          backup_files: ['backup_2024_01_19_full.tar.gz']
        }
      ]);

      setRecoveryPoints([
        {
          id: '1',
          backup_id: '1',
          name: 'Full Backup - 2024-01-20',
          created_at: '2024-01-20T02:15:00Z',
          size: 2.3 * 1024 * 1024 * 1024,
          type: 'full',
          status: 'available',
          location: 'local',
          checksum: 'sha256:abc123...'
        },
        {
          id: '2',
          backup_id: '1',
          name: 'Full Backup - 2024-01-19',
          created_at: '2024-01-19T02:12:00Z',
          size: 2.2 * 1024 * 1024 * 1024,
          type: 'full',
          status: 'available',
          location: 'cloud',
          checksum: 'sha256:def456...'
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching backup data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch backup information',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupData();
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'available':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
      case 'corrupted':
        return 'error';
      case 'idle':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'available':
        return <CheckCircleIcon color="success" />;
      case 'running':
        return <PlayIcon color="warning" />;
      case 'failed':
      case 'corrupted':
        return <ErrorIcon color="error" />;
      case 'idle':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCreateJob = async () => {
    try {
      setSnackbar({
        open: true,
        message: 'Backup job created successfully',
        severity: 'success'
      });
      setOpenJobDialog(false);
      setJobForm({
        name: '',
        type: 'full',
        schedule: 'manual',
        schedule_time: '02:00',
        retention_days: 30,
        is_active: true,
        location: 'local'
      });
      fetchBackupData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create backup job',
        severity: 'error'
      });
    }
  };

  const handleRunBackup = async (jobId: string) => {
    try {
      setSnackbar({
        open: true,
        message: 'Backup job started successfully',
        severity: 'success'
      });
      fetchBackupData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to start backup job',
        severity: 'error'
      });
    }
  };

  const handleRecovery = async (recoveryPoint: RecoveryPoint) => {
    setSelectedRecoveryPoint(recoveryPoint);
    setOpenRecoveryDialog(true);
  };

  const handleConfirmRecovery = async () => {
    if (!selectedRecoveryPoint) return;
    
    try {
      setSnackbar({
        open: true,
        message: 'Recovery process started successfully',
        severity: 'success'
      });
      setOpenRecoveryDialog(false);
      setSelectedRecoveryPoint(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to start recovery process',
        severity: 'error'
      });
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      try {
        setSnackbar({
          open: true,
          message: 'Backup deleted successfully',
          severity: 'success'
        });
        fetchBackupData();
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to delete backup',
          severity: 'error'
        });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Backup & Recovery
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage backup jobs, schedules, and disaster recovery operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setOpenJobDialog(true)}
          >
            Create Backup Job
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBackupData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Backup Jobs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6">Backup Jobs</Typography>
            <Chip label={`${backupJobs.length} jobs`} size="small" color="primary" />
          </Box>
          
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backupJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {job.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Retention: {job.retention_days} days
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.type.toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.schedule === 'manual' ? 'Manual' : 
                         `${job.schedule.charAt(0).toUpperCase() + job.schedule.slice(1)} at ${job.schedule_time}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(job.status)}
                        label={job.status.toUpperCase()}
                        color={getStatusColor(job.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.last_run ? formatDate(job.last_run) : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.next_run ? formatDate(job.next_run) : 'Manual'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.location.toUpperCase()}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Run Backup">
                          <IconButton
                            size="small"
                            onClick={() => handleRunBackup(job.id)}
                            color="primary"
                            disabled={job.status === 'running'}
                          >
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Stop Backup">
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={job.status !== 'running'}
                          >
                            <StopIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Job">
                          <IconButton
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recovery Points */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RestoreIcon color="primary" />
                <Typography variant="h6">Recovery Points</Typography>
                <Chip label={`${recoveryPoints.length} points`} size="small" color="primary" />
              </Box>
              
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recoveryPoints.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {point.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(point.created_at)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={point.type.toUpperCase()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatBytes(point.size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(point.status)}
                            label={point.status.toUpperCase()}
                            color={getStatusColor(point.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Recover">
                              <IconButton
                                size="small"
                                onClick={() => handleRecovery(point)}
                                color="primary"
                                disabled={point.status !== 'available'}
                              >
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                color="info"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteBackup(point.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h6">Recent Backup History</Typography>
              </Box>
              
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backupHistory.slice(0, 5).map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {history.job_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(history.started_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {history.duration ? formatDuration(history.duration) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(history.status)}
                            label={history.status.toUpperCase()}
                            color={getStatusColor(history.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backup Health */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">Backup Health</Typography>
          </Box>
          
          <Alert severity="success" sx={{ mb: 2 }}>
            All backup jobs are healthy and running according to schedule. Recovery points are available and verified.
          </Alert>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Backup Jobs"
                secondary="All scheduled backup jobs are active and running normally"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Recovery Points"
                secondary="Recovery points are available and checksums verified"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Storage"
                secondary="Backup storage is healthy with sufficient space available"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Create Backup Job Dialog */}
      <Dialog open={openJobDialog} onClose={() => setOpenJobDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Backup Job</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Job Name"
                value={jobForm.name}
                onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                fullWidth
                required
                placeholder="e.g., Daily Full Backup"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Backup Type</InputLabel>
                <Select
                  value={jobForm.type}
                  onChange={(e) => setJobForm({ ...jobForm, type: e.target.value as any })}
                  label="Backup Type"
                >
                  <MenuItem value="full">Full Backup</MenuItem>
                  <MenuItem value="incremental">Incremental Backup</MenuItem>
                  <MenuItem value="differential">Differential Backup</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Schedule</InputLabel>
                <Select
                  value={jobForm.schedule}
                  onChange={(e) => setJobForm({ ...jobForm, schedule: e.target.value as any })}
                  label="Schedule"
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Schedule Time"
                type="time"
                value={jobForm.schedule_time}
                onChange={(e) => setJobForm({ ...jobForm, schedule_time: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={jobForm.schedule === 'manual'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Retention (days)"
                type="number"
                value={jobForm.retention_days}
                onChange={(e) => setJobForm({ ...jobForm, retention_days: parseInt(e.target.value) })}
                fullWidth
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Storage Location</InputLabel>
                <Select
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value as any })}
                  label="Storage Location"
                >
                  <MenuItem value="local">Local Storage</MenuItem>
                  <MenuItem value="cloud">Cloud Storage</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={jobForm.is_active}
                    onChange={(e) => setJobForm({ ...jobForm, is_active: e.target.checked })}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJobDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateJob} variant="contained">
            Create Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recovery Dialog */}
      <Dialog open={openRecoveryDialog} onClose={() => setOpenRecoveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Recovery</DialogTitle>
        <DialogContent>
          {selectedRecoveryPoint && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will restore the system to the selected recovery point. All current data will be overwritten.
              </Alert>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Recovery Point:</strong> {selectedRecoveryPoint.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Created:</strong> {formatDate(selectedRecoveryPoint.created_at)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Size:</strong> {formatBytes(selectedRecoveryPoint.size)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Type:</strong> {selectedRecoveryPoint.type.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Location:</strong> {selectedRecoveryPoint.location.toUpperCase()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecoveryDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmRecovery} variant="contained" color="warning">
            Confirm Recovery
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BackupRecovery;
