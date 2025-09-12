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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { 
  Refresh, 
  Analytics,
  ExpandMore,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { api } from '../../api';
import { useDateFormat } from '../hooks/useDateFormat';

interface LineInsights {
  message_delivery?: {
    status?: string;
    overview?: {
      delivery?: number;
      unique_impression?: number;
      unique_click?: number;
      unique_media_played?: number;
      unique_media_played_100_percent?: number;
    };
    error?: string;
  };
  followers?: {
    followers?: number;
    targeted_reaches?: number;
    blocks?: number;
    error?: string;
  };
  demographics?: {
    ages?: Array<{
      age?: string;
      percentage?: number;
    }>;
    genders?: Array<{
      gender?: string;
      percentage?: number;
    }>;
    areas?: Array<{
      area?: string;
      percentage?: number;
    }>;
    platforms?: Array<{
      platform?: string;
      percentage?: number;
    }>;
    error?: string;
  };
  user_interaction?: {
    overview?: {
      friend_add?: number;
      friend_block?: number;
      message?: number;
      postback?: number;
    };
    error?: string;
  };
  message_quota?: {
    overview?: {
      type?: string;
      value?: number;
    };
    error?: string;
  };
  message_consumption?: {
    overview?: {
      totalUsage?: number;
      type?: string;
    };
    error?: string;
  };
  bot_info?: {
    overview?: {
      userId?: string;
      displayName?: string;
      pictureUrl?: string;
      statusMessage?: string;
    };
    error?: string;
  };
}

interface InsightsResponse {
  success: boolean;
  insights: LineInsights;
  timestamp: string;
  message: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MessageDashboard: React.FC = () => {
  const [insights, setInsights] = useState<LineInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { formatDate } = useDateFormat();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/bot/line-insights');
      const data: InsightsResponse = response.data;
      
      if (data.success) {
        setInsights(data.insights);
        setLastUpdated(data.timestamp);
      } else {
        setError('Failed to load insights data');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load LINE insights');
    } finally {
      setLoading(false);
    }
  };

  const hasError = (data: any) => data && data.error;
  const hasData = (data: any) => data && !data.error;

  const getStatusIcon = (data: any) => {
    if (hasError(data)) return <Error color="error" />;
    if (hasData(data)) return <CheckCircle color="success" />;
    return <Info color="info" />;
  };

  const getStatusColor = (data: any) => {
    if (hasError(data)) return 'error';
    if (hasData(data)) return 'success';
    return 'info';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Early return if no insights data
  if (!insights) {
    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Analytics color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            LINE Insights Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadInsights}
            disabled={loading}
            size="small"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info">
          Click "Refresh" to load LINE Insights data.
        </Alert>
      </Box>
    );
  }

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
            <Analytics sx={{ fontSize: 28, color: 'white' }} />
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
              LINE Insights Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Real-time LINE message analytics and insights
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadInsights}
          disabled={loading}
          size="small"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {lastUpdated && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Last updated: {formatDate(lastUpdated, { includeTime: true })}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Message Delivery Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(insights?.message_delivery)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Message Delivery
                </Typography>
                <Chip 
                  label={insights?.message_delivery?.status || 'Unknown'} 
                  color={getStatusColor(insights?.message_delivery) as any}
                  size="small"
                />
              </Box>
              
                             {hasData(insights?.message_delivery) && insights?.message_delivery?.overview ? (
                 <Box>
                   <Typography variant="h4" sx={{ mb: 1, color: 'primary.main' }}>
                     {insights?.message_delivery?.overview?.delivery?.toLocaleString() || 0}
                   </Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                     Messages Delivered Today
                   </Typography>
                   
                   <Grid container spacing={2}>
                     <Grid item xs={6}>
                       <Typography variant="body2" color="text.secondary">
                         Unique Impressions
                       </Typography>
                       <Typography variant="h6">
                         {insights?.message_delivery?.overview?.unique_impression?.toLocaleString() || 0}
                       </Typography>
                     </Grid>
                     <Grid item xs={6}>
                       <Typography variant="body2" color="text.secondary">
                         Unique Clicks
                       </Typography>
                       <Typography variant="h6">
                         {insights?.message_delivery?.overview?.unique_click?.toLocaleString() || 0}
                       </Typography>
                     </Grid>
                   </Grid>
                 </Box>
               ) : (
                 <Typography color="text.secondary">
                   {insights?.message_delivery?.error || 'No data available'}
                 </Typography>
               )}
            </CardContent>
          </Card>
        </Grid>

        {/* Followers Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(insights?.followers)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Followers
                </Typography>
                <Chip 
                  label={hasData(insights?.followers) ? 'Active' : 'Error'} 
                  color={getStatusColor(insights?.followers) as any}
                  size="small"
                />
              </Box>
              
              {hasData(insights?.followers) ? (
                <Box>
                  <Typography variant="h4" sx={{ mb: 1, color: 'primary.main' }}>
                    {insights.followers?.followers?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Total Followers
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Targeted Reaches
                      </Typography>
                      <Typography variant="h6">
                        {insights.followers?.targeted_reaches?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Blocks
                      </Typography>
                      <Typography variant="h6">
                        {insights.followers?.blocks?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {insights?.followers?.error || 'No data available'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Demographics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(insights?.demographics)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Demographics
                </Typography>
                <Chip 
                  label={hasData(insights?.demographics) ? 'Available' : 'Error'} 
                  color={getStatusColor(insights?.demographics) as any}
                  size="small"
                />
              </Box>
              
              {hasData(insights?.demographics) ? (
                <Grid container spacing={3}>
                  {/* Age Distribution */}
                  {insights.demographics?.ages && insights.demographics.ages.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Age Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={insights.demographics.ages}
                            dataKey="percentage"
                            nameKey="age"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            label={({ age, percentage }) => `${age}: ${percentage}%`}
                          >
                                                         {insights.demographics.ages.map((_, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                  )}

                  {/* Gender Distribution */}
                  {insights.demographics?.genders && insights.demographics.genders.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Gender Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={insights.demographics.genders}
                            dataKey="percentage"
                            nameKey="gender"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            label={({ gender, percentage }) => `${gender}: ${percentage}%`}
                          >
                                                         {insights.demographics.genders.map((_, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                  )}

                  {/* Platform Distribution */}
                  {insights.demographics?.platforms && insights.demographics.platforms.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Platform Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={insights.demographics.platforms}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="platform" />
                          <YAxis />
                          <Bar dataKey="percentage" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  {insights?.demographics?.error || 'No demographics data available'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Interaction Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(insights?.user_interaction)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  User Interactions
                </Typography>
                <Chip 
                  label={hasData(insights?.user_interaction) ? 'Active' : 'Error'} 
                  color={getStatusColor(insights?.user_interaction) as any}
                  size="small"
                />
              </Box>
              
              {hasData(insights?.user_interaction) && insights?.user_interaction?.overview ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Friend Adds
                      </Typography>
                      <Typography variant="h6">
                        {insights.user_interaction.overview.friend_add?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Friend Blocks
                      </Typography>
                      <Typography variant="h6">
                        {insights.user_interaction.overview.friend_block?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Messages
                      </Typography>
                      <Typography variant="h6">
                        {insights.user_interaction.overview.message?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Postbacks
                      </Typography>
                      <Typography variant="h6">
                        {insights.user_interaction.overview.postback?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {insights?.user_interaction?.error || 'No interaction data available'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Message Quota */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(insights?.message_quota)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Message Quota
                </Typography>
                <Chip 
                  label={hasData(insights?.message_quota) ? 'Available' : 'Error'} 
                  color={getStatusColor(insights?.message_quota) as any}
                  size="small"
                />
              </Box>
              
              {hasData(insights?.message_quota) && insights?.message_quota?.overview ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Quota Type
                      </Typography>
                      <Typography variant="h6">
                        {insights.message_quota.overview.type || 'Unknown'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Quota Value
                      </Typography>
                      <Typography variant="h6">
                        {insights.message_quota.overview.value?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {insights?.message_quota?.error || 'No quota data available'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Analytics */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Detailed Analytics
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
                             <Grid container spacing={3}>
                 {/* Message Consumption */}
                 <Grid item xs={12} md={6}>
                   <Card variant="outlined">
                     <CardContent>
                       <Typography variant="subtitle1" sx={{ mb: 2 }}>
                         Message Consumption
                       </Typography>
                       {hasData(insights?.message_consumption) && insights?.message_consumption?.overview ? (
                         <Box>
                           <Typography variant="h6" sx={{ mb: 1 }}>
                             {insights.message_consumption.overview.totalUsage?.toLocaleString() || 0} Messages Used
                           </Typography>
                           <Typography variant="body2" color="text.secondary">
                             Type: {insights.message_consumption.overview.type || 'Unknown'}
                           </Typography>
                         </Box>
                       ) : (
                         <Typography color="text.secondary">
                           {insights?.message_consumption?.error || 'No consumption data'}
                         </Typography>
                       )}
                     </CardContent>
                   </Card>
                 </Grid>

                 {/* Bot Info */}
                 <Grid item xs={12} md={6}>
                   <Card variant="outlined">
                     <CardContent>
                       <Typography variant="subtitle1" sx={{ mb: 2 }}>
                         Bot Information
                       </Typography>
                       {hasData(insights?.bot_info) && insights?.bot_info?.overview ? (
                         <Box>
                           <Typography variant="h6" sx={{ mb: 1 }}>
                             {insights.bot_info.overview.displayName || 'Unknown'}
                           </Typography>
                           <Typography variant="body2" color="text.secondary">
                             ID: {insights.bot_info.overview.userId || 'Unknown'}
                           </Typography>
                           {insights.bot_info.overview.statusMessage && (
                             <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                               Status: {insights.bot_info.overview.statusMessage}
                             </Typography>
                           )}
                         </Box>
                       ) : (
                         <Typography color="text.secondary">
                           {insights?.bot_info?.error || 'No bot info available'}
                         </Typography>
                       )}
                     </CardContent>
                   </Card>
                 </Grid>
               </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Data Source:</strong> This dashboard uses official LINE Insights API endpoints to provide real-time analytics data. 
          Some data may have processing delays and may not be immediately available for the current day.
        </Typography>
      </Alert>
    </Box>
  );
};

export default MessageDashboard;
