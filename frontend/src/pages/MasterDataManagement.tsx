import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Home,
  Dashboard
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import provincesService from '../services/provincesService';
import districtsService from '../services/districtsService';
import subdistrictsService from '../services/subdistrictsService';

interface MasterDataSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  items: MasterDataItem[];
  route: string;
}

interface MasterDataItem {
  id: string;
  name: string;
  description: string;
  count?: number;
  route: string;
}

const MasterDataManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [dataCounts, setDataCounts] = useState({
    provinces: 0,
    districts: 0,
    subdistricts: 0,
    hospitals: 10349 // We know this from our import
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('MasterDataManagement component is rendering');

  // Load real data counts
  useEffect(() => {
    const loadDataCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const [provincesCount, districtsCount, subdistrictsCount] = await Promise.all([
          provincesService.getProvincesCount(),
          districtsService.getAllDistricts().then(districts => districts.length),
          subdistrictsService.getAllSubdistricts().then(subdistricts => subdistricts.length)
        ]);

        setDataCounts({
          provinces: provincesCount,
          districts: districtsCount,
          subdistricts: subdistrictsCount,
          hospitals: 10349 // From our import
        });
      } catch (err) {
        console.error('Error loading data counts:', err);
        setError('Failed to load master data counts');
      } finally {
        setLoading(false);
      }
    };

    loadDataCounts();
  }, []);

  const masterDataSections: MasterDataSection[] = [
    {
      id: 'geolocations',
      title: 'Geolocations',
      description: 'Manage geographic data including provinces, districts, and subdistricts',
      icon: <LocationIcon />,
      color: '#1976d2',
      route: '/dashboard/master-data/geolocations',
      items: [
        {
          id: 'provinces',
          name: 'Provinces',
          description: 'Manage provinces and administrative regions',
          count: dataCounts.provinces,
          route: '/dashboard/master-data/geolocations'
        },
        {
          id: 'districts',
          name: 'Districts',
          description: 'Manage districts within provinces',
          count: dataCounts.districts,
          route: '/dashboard/master-data/geolocations'
        },
        {
          id: 'subdistricts',
          name: 'Subdistricts',
          description: 'Manage subdistricts within districts',
          count: dataCounts.subdistricts,
          route: '/dashboard/master-data/geolocations'
        }
      ]
    },
    {
      id: 'hospitals',
      title: 'Hospitals',
      description: 'Manage hospital types and hospital information',
      icon: <HospitalIcon />,
      color: '#d32f2f',
      route: '/dashboard/master-data/hospitals',
      items: [
        {
          id: 'hospital-types',
          name: 'Hospital Types',
          description: 'Manage different types of hospitals',
          count: 21,
          route: '/dashboard/master-data/hospitals'
        },
        {
          id: 'hospitals',
          name: 'Hospitals',
          description: 'Manage hospital information and details',
          count: dataCounts.hospitals,
          route: '/dashboard/master-data/hospitals'
        }
      ]
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (route: string) => {
    navigate(route);
  };

  const handleSectionClick = (route: string) => {
    navigate(route);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Debug indicator */}
      <Box sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          ✅ MasterDataManagement component is rendering successfully
          {loading && ' - Loading real data counts...'}
          {!loading && !error && ' - Real data loaded successfully!'}
          {error && ' - Error loading data'}
        </Typography>
      </Box>

      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Dashboard sx={{ mr: 0.5 }} fontSize="inherit" />
          {t('master_data.title')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('master_data.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t('master_data.subtitle')}
        </Typography>
      </Box>

      {/* Master Data Sections */}
      <Grid container spacing={3}>
        {masterDataSections.map((section) => (
          <Grid item xs={12} md={6} key={section.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                {/* Section Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: `${section.color}20`,
                      color: section.color,
                      mr: 2
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2">
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View All">
                      <IconButton 
                        size="small"
                        onClick={() => handleSectionClick(section.route)}
                        sx={{ color: section.color }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Manage">
                      <IconButton 
                        size="small"
                        onClick={() => handleSectionToggle(section.id)}
                        sx={{ color: section.color }}
                      >
                        {expandedSections.has(section.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Section Items */}
                <Collapse in={expandedSections.has(section.id)}>
                  <List dense>
                    {section.items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <ListItem
                          sx={{
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: `${section.color}10`
                            }
                          }}
                          onClick={() => handleItemClick(item.route)}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: section.color
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.name}
                            secondary={item.description}
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {item.count && (
                                <Chip
                                  label={item.count.toLocaleString()}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    borderColor: section.color,
                                    color: section.color,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              )}
                              <IconButton size="small" edge="end">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < section.items.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>

                {/* Quick Actions */}
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="outlined"
                      sx={{ 
                        borderColor: section.color,
                        color: section.color,
                        '&:hover': {
                          borderColor: section.color,
                          backgroundColor: `${section.color}10`
                        }
                      }}
                      onClick={() => handleSectionClick(section.route)}
                    >
                      Add New
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                      variant="contained"
                      sx={{ 
                        backgroundColor: section.color,
                        '&:hover': {
                          backgroundColor: section.color,
                          opacity: 0.9
                        }
                      }}
                      onClick={() => handleSectionClick(section.route)}
                    >
                      Manage
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Statistics Summary */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Master Data Statistics
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {dataCounts.provinces.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provinces
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {dataCounts.districts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Districts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {dataCounts.subdistricts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Subdistricts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {dataCounts.hospitals.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hospitals
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default MasterDataManagement;
