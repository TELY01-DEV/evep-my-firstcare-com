import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  People,
  Search,
  Refresh,
  Visibility,
  PersonAdd,
  PersonRemove,
  TrendingUp,
  TrendingDown,
  Download,
  Close,
  AccessTime,
  Message,
  Info,
  CalendarToday,
  Person
} from '@mui/icons-material';

import { api } from '../../api';
import { useDateFormat } from '../hooks/useDateFormat';

interface LineFollower {
  _id: string;
  line_user_id: string;
  display_name: string;
  picture_url?: string;
  status_message?: string;
  followed_at: string;
  followed_at_formatted?: string;
  is_active: boolean;
  last_interaction?: string;
  last_interaction_formatted?: string;
  interaction_count?: number;
}

interface LineFollowersResponse {
  success: boolean;
  followers: LineFollower[];
  total: number;
  active_count: number;
  inactive_count: number;
  today_follows: number;
  today_unfollows: number;
}

const LineFollowers: React.FC = () => {
  const { formatDate } = useDateFormat();

  const [followers, setFollowers] = useState<LineFollower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    active_count: 0,
    inactive_count: 0,
    today_follows: 0,
    today_unfollows: 0
  });
  const [selectedFollower, setSelectedFollower] = useState<LineFollower | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchFollowers();
  }, [page, rowsPerPage]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/line-followers?page=${page + 1}&limit=${rowsPerPage}&search=${searchTerm}`);
      const data: LineFollowersResponse = response.data;
      
      if (data.success) {
        setFollowers(data.followers);
        setStats({
          total: data.total,
          active_count: data.active_count,
          inactive_count: data.inactive_count,
          today_follows: data.today_follows,
          today_unfollows: data.today_unfollows
        });
      } else {
        setError('Failed to fetch followers data');
      }
    } catch (err: any) {
      console.error('Error fetching followers:', err);
      setError(err.message || 'Failed to fetch followers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchFollowers();
  };

  const handleRefresh = () => {
    fetchFollowers();
  };

  const handleViewDetails = (follower: LineFollower) => {
    setSelectedFollower(follower);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedFollower(null);
  };

  const handleExportCSV = () => {
    const headers = ['LINE User ID', 'Display Name', 'Status Message', 'Followed At', 'Status', 'Last Interaction'];
    const csvContent = [
      headers.join(','),
      ...followers.map(follower => [
        follower.line_user_id,
        `"${follower.display_name || ''}"`,
        `"${follower.status_message || ''}"`,
        formatDate(follower.followed_at),
        follower.is_active ? 'Active' : 'Inactive',
        follower.last_interaction ? formatDate(follower.last_interaction) : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `line_followers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredFollowers = followers.filter(follower =>
    follower.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    follower.line_user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    follower.status_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
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
          <People sx={{ fontSize: 28, color: 'white' }} />
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
            LINE Followers
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Manage and monitor LINE Bot followers
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Followers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.active_count}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Followers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.today_follows}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Today's Follows
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.today_unfollows}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Today's Unfollows
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: 'text.primary'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.inactive_count}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Inactive Followers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            color: 'text.primary'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.total > 0 ? Math.round((stats.active_count / stats.total) * 100) : 0}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Retention Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search by name, LINE ID, or status message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportCSV}
                  disabled={followers.length === 0}
                >
                  Export CSV
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Followers Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Follower</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>LINE User ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status Message</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Followed At</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Interaction</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFollowers.map((follower) => (
                      <TableRow key={follower._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={follower.picture_url}
                              sx={{ width: 40, height: 40 }}
                            >
                              {follower.display_name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {follower.display_name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {follower.interaction_count || 0} interactions
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {follower.line_user_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ 
                            fontStyle: 'italic',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {follower.status_message || 'No status message'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {follower.followed_at_formatted || formatDate(follower.followed_at, { includeTime: true })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={follower.is_active ? 'Active' : 'Inactive'}
                            color={follower.is_active ? 'success' : 'default'}
                            size="small"
                            icon={follower.is_active ? <PersonAdd /> : <PersonRemove />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {follower.last_interaction 
                              ? (follower.last_interaction_formatted || formatDate(follower.last_interaction, { includeTime: true }))
                              : 'Never'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small"
                                onClick={() => handleViewDetails(follower)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={stats.total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Follower Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Follower Details</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFollower && (
            <Box sx={{ pt: 1 }}>
              {/* Profile Section */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                  <Avatar
                    src={selectedFollower.picture_url}
                    sx={{ width: 80, height: 80 }}
                  >
                    {selectedFollower.display_name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {selectedFollower.display_name || 'Unknown'}
                    </Typography>
                    <Chip
                      label={selectedFollower.is_active ? 'Active' : 'Inactive'}
                      color={selectedFollower.is_active ? 'success' : 'default'}
                      icon={selectedFollower.is_active ? <PersonAdd /> : <PersonRemove />}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {selectedFollower.line_user_id}
                    </Typography>
                  </Box>
                </Box>
                {selectedFollower.status_message && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Status Message:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {selectedFollower.status_message}
                    </Typography>
                  </Box>
                )}
              </Card>

              {/* Details Section */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Info color="primary" />
                      Follow Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Followed At"
                          secondary={selectedFollower.followed_at_formatted || formatDate(selectedFollower.followed_at, { includeTime: true })}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AccessTime fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Interaction"
                          secondary={selectedFollower.last_interaction 
                            ? (selectedFollower.last_interaction_formatted || formatDate(selectedFollower.last_interaction, { includeTime: true }))
                            : 'Never'
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Message fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Interaction Count"
                          secondary={selectedFollower.interaction_count || 0}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      Account Status
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Chip
                              label={selectedFollower.is_active ? 'Active Follower' : 'Inactive Follower'}
                              color={selectedFollower.is_active ? 'success' : 'default'}
                              size="small"
                              icon={selectedFollower.is_active ? <PersonAdd /> : <PersonRemove />}
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Profile Picture"
                          secondary={selectedFollower.picture_url ? 'Available' : 'Not available'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Display Name"
                          secondary={selectedFollower.display_name || 'Not set'}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Grid>
              </Grid>

              {/* Additional Information */}
              <Card sx={{ mt: 3, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Follower ID:</strong> {selectedFollower._id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Status Message Length:</strong> {selectedFollower.status_message?.length || 0} characters
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LineFollowers;
