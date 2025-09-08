import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CardActions,
} from '@mui/material';
import {
  Search,
  Psychology,
  Assessment,
  School,
  Person,
  Business,
  LocalHospital,
  Visibility,
  ContentCopy,
  Refresh,
  TrendingUp,
  Insights,
  AutoAwesome,
  SmartToy,
  FilterList,
  Clear,
} from '@mui/icons-material';
import unifiedApi from '../../services/unifiedApi';

interface AIInsightSearchProps {
  onInsightSelected?: (insight: any) => void;
}

interface SearchFilters {
  role?: string;
  insight_type?: string;
  query: string;
  n_results: number;
}

const AIInsightSearch: React.FC<AIInsightSearchProps> = ({
  onInsightSelected,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    n_results: 10,
  });
  const [hasSearched, setHasSearched] = useState(false);

  const roleOptions = [
    { value: 'doctor', label: 'Doctor', icon: <LocalHospital />, color: '#1976d2' },
    { value: 'teacher', label: 'Teacher', icon: <School />, color: '#388e3c' },
    { value: 'parent', label: 'Parent', icon: <Person />, color: '#f57c00' },
    { value: 'executive', label: 'Executive', icon: <Business />, color: '#7b1fa2' },
    { value: 'medical_staff', label: 'Medical Staff', icon: <LocalHospital />, color: '#d32f2f' },
  ];

  const insightTypeOptions = [
    { value: 'screening_analysis', label: 'Screening Analysis' },
    { value: 'diagnosis_support', label: 'Diagnosis Support' },
    { value: 'treatment_planning', label: 'Treatment Planning' },
    { value: 'academic_impact', label: 'Academic Impact' },
    { value: 'classroom_accommodations', label: 'Classroom Accommodations' },
    { value: 'parent_guidance', label: 'Parent Guidance' },
    { value: 'trend_analysis', label: 'Trend Analysis' },
    { value: 'mobile_screening', label: 'Mobile Screening' },
  ];

  const searchInsights = async () => {
    if (!filters.query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await unifiedApi.post(
        '/api/v1/ai-insights/search-insights',
        filters
      );

      if (response.data.success) {
        setSearchResults(response.data.results);
        setHasSearched(true);
      } else {
        setError('Failed to search insights');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error searching insights');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchInsights();
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      n_results: 10,
    });
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleInsightClick = (insight: any) => {
    onInsightSelected?.(insight);
  };

  const copyInsightText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRoleIcon = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.icon : <Psychology />;
  };

  const getRoleColor = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.color : '#666';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Search color="primary" />
          <Typography variant="h5">
            Search AI Insights
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search Filters */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterList />
            <Typography variant="h6">
              Search Filters
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Query"
                placeholder="Enter keywords to search insights..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined })}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roleOptions.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Insight Type</InputLabel>
                <Select
                  value={filters.insight_type || ''}
                  onChange={(e) => setFilters({ ...filters, insight_type: e.target.value || undefined })}
                  label="Insight Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {insightTypeOptions.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Results</InputLabel>
                <Select
                  value={filters.n_results}
                  onChange={(e) => setFilters({ ...filters, n_results: e.target.value as number })}
                  label="Results"
                >
                  <MenuItem value={5}>5 results</MenuItem>
                  <MenuItem value={10}>10 results</MenuItem>
                  <MenuItem value={20}>20 results</MenuItem>
                  <MenuItem value={50}>50 results</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<Clear />}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* Search Results */}
        {hasSearched && (
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Search Results ({searchResults.length})
              </Typography>
              <Button
                variant="outlined"
                onClick={handleSearch}
                disabled={loading}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
            </Box>

            {searchResults.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                <SmartToy sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No insights found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or generating new insights.
                </Typography>
              </Paper>
            ) : (
              <List>
                {searchResults.map((insight, index) => (
                  <Paper key={index} elevation={1} sx={{ mb: 2 }}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleInsightClick(insight)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getRoleColor(insight.metadata?.role || 'unknown') }}>
                          {getRoleIcon(insight.metadata?.role || 'unknown')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" component="span">
                              AI Insight
                            </Typography>
                            <Chip
                              label={insight.metadata?.role || 'unknown'}
                              size="small"
                              color="primary"
                            />
                            {insight.metadata?.insight_type && (
                              <Chip
                                label={insight.metadata.insight_type}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1,
                              }}
                            >
                              {insight.text}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Typography variant="caption" color="text.secondary">
                                {formatTimestamp(insight.metadata?.created_at || '')}
                              </Typography>
                              {insight.metadata?.model_used && (
                                <Typography variant="caption" color="text.secondary">
                                  Model: {insight.metadata.model_used}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <Box>
                        <Tooltip title="Copy insight text">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyInsightText(insight.text);
                            }}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View full insight">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightClick(insight);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightSearch;
