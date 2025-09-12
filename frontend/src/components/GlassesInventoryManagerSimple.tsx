import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  Inventory,
  Add,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import unifiedApi from '../services/unifiedApi';

interface GlassesItem {
  item_id: string;
  item_code: string;
  item_name: string;
  category: string;
  brand?: string;
  model?: string;
  specifications?: {
    frame_color?: string;
    lens_type?: string;
    prescription_range?: string;
    size?: string;
    material?: string;
  };
  current_stock: number;
  reorder_level: number;
  unit_price: number;
  cost_price: number;
  supplier_info?: {
    name?: string;
    contact?: string;
    location?: string;
  };
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GlassesDelivery {
  delivery_id: string;
  patient_id: string;
  patient_name: string;
  patient_cid: string;
  glasses_items: any[];
  prescription_details: any;
  delivery_date: string;
  delivery_status: string;
  delivery_method: string;
  delivered_by: string;
  school_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface GlassesInventoryManagerProps {
  mode?: 'inventory' | 'delivery';
}

const GlassesInventoryManagerSimple: React.FC<GlassesInventoryManagerProps> = ({ mode = 'inventory' }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<GlassesItem[]>([]);
  const [deliveries, setDeliveries] = useState<GlassesDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'inventory') {
      fetchInventory();
    } else {
      fetchDeliveries();
    }
  }, [mode]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching inventory from: /api/v1/inventory/glasses');
      
      const response = await unifiedApi.get('/api/v1/inventory/glasses');
      console.log('Inventory API Response:', response.data);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      if (error.response) {
        console.error('Inventory API Error:', error.response.status, error.response.statusText, error.response.data);
        setError(`Failed to fetch inventory: ${error.response.status} ${error.response.statusText}`);
      } else {
        setError('Error fetching inventory data');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching deliveries from: /api/v1/glasses-delivery');
      
      const response = await unifiedApi.get('/api/v1/glasses-delivery');
      console.log('Deliveries API Response:', response.data);
      setDeliveries(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      if (error.response) {
        console.error('Deliveries API Error:', error.response.status, error.response.statusText, error.response.data);
        setError(`Failed to fetch deliveries: ${error.response.status} ${error.response.statusText}`);
      } else {
        setError('Error fetching delivery data');
      }
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stock: number, reorderLevel: number) => {
    if (stock === 0) return 'error';
    if (stock <= reorderLevel) return 'warning';
    return 'success';
  };

  const getStatusText = (stock: number, reorderLevel: number) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'success';
      case 'in_transit': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleRefresh = () => {
    if (mode === 'inventory') {
      fetchInventory();
    } else {
      fetchDeliveries();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Inventory sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {mode === 'inventory' ? 'Glasses Inventory Management' : 'Glasses Delivery Management'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Add New Item
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {mode === 'inventory' ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Items
                  </Typography>
                  <Typography variant="h4">
                    {items.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    In Stock
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {items.filter(item => item.current_stock > item.reorder_level).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {items.filter(item => item.current_stock > 0 && item.current_stock <= item.reorder_level).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {items.filter(item => item.current_stock === 0).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Deliveries
                  </Typography>
                  <Typography variant="h4">
                    {deliveries.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Delivered
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {deliveries.filter(delivery => delivery.delivery_status.toLowerCase() === 'delivered').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    In Transit
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {deliveries.filter(delivery => delivery.delivery_status.toLowerCase() === 'in_transit').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {deliveries.filter(delivery => delivery.delivery_status.toLowerCase() === 'pending').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Data Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {mode === 'inventory' ? 'Inventory Items' : 'Delivery Records'}
          </Typography>
          
          {mode === 'inventory' ? (
            items.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No inventory items found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Click "Add New Item" to start adding inventory items.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.item_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {item.item_name}
                            </Typography>
                            {item.model && (
                              <Typography variant="body2" color="text.secondary">
                                {item.model}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{item.brand || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.current_stock}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(item.current_stock, item.reorder_level)}
                            size="small"
                            color={getStatusColor(item.current_stock, item.reorder_level) as any}
                          />
                        </TableCell>
                        <TableCell>฿{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell>{item.supplier_info?.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            deliveries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No delivery records found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Delivery records will appear here when glasses are delivered to patients.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Delivery ID</TableCell>
                      <TableCell>Patient Name</TableCell>
                      <TableCell>School</TableCell>
                      <TableCell>Delivery Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Delivered By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.delivery_id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {delivery.delivery_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {delivery.patient_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {delivery.patient_cid}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{delivery.school_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(delivery.delivery_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={delivery.delivery_status}
                            size="small"
                            color={getDeliveryStatusColor(delivery.delivery_status) as any}
                          />
                        </TableCell>
                        <TableCell>{delivery.delivery_method}</TableCell>
                        <TableCell>{delivery.delivered_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default GlassesInventoryManagerSimple;
