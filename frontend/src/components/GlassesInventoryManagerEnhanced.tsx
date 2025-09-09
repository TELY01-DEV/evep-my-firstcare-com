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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Inventory,
  Add,
  Refresh,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  Home,
  Dashboard,
  MedicalServices,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface GlassesItemFormData {
  item_code: string;
  item_name: string;
  category: string;
  brand: string;
  model: string;
  unit_price: number;
  cost_price: number;
  initial_stock: number;
  reorder_level: number;
  supplier_name: string;
  supplier_contact: string;
  supplier_location: string;
  notes: string;
}

interface StockAdjustmentData {
  adjustment_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference_document: string;
  notes: string;
}

interface GlassesInventoryManagerProps {
  mode?: 'inventory' | 'delivery';
}

const GlassesInventoryManagerEnhanced: React.FC<GlassesInventoryManagerProps> = ({ mode = 'inventory' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [items, setItems] = useState<GlassesItem[]>([]);
  const [deliveries, setDeliveries] = useState<GlassesDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<GlassesItemFormData>({
    item_code: '',
    item_name: '',
    category: '',
    brand: '',
    model: '',
    unit_price: 0,
    cost_price: 0,
    initial_stock: 0,
    reorder_level: 0,
    supplier_name: '',
    supplier_contact: '',
    supplier_location: '',
    notes: '',
  });
  
  const [stockAdjustmentData, setStockAdjustmentData] = useState<StockAdjustmentData>({
    adjustment_type: 'in',
    quantity: 0,
    reason: '',
    reference_document: '',
    notes: '',
  });
  
  const [selectedItem, setSelectedItem] = useState<GlassesItem | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<GlassesDelivery | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Categories for dropdown
  const categories = ['frames', 'lenses', 'accessories', 'sunglasses', 'reading_glasses'];

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
      
      const response = await unifiedApi.get('/api/v1/inventory/glasses');
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      if (error.response) {
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
      
      const response = await unifiedApi.get('/api/v1/glasses-delivery');
      setDeliveries(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      if (error.response) {
        setError(`Failed to fetch deliveries: ${error.response.status} ${error.response.statusText}`);
      } else {
        setError('Error fetching delivery data');
      }
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    try {
      setFormErrors({});
      
      // Validation
      const errors: Record<string, string> = {};
      if (!formData.item_code.trim()) errors.item_code = 'Item code is required';
      if (!formData.item_name.trim()) errors.item_name = 'Item name is required';
      if (!formData.category) errors.category = 'Category is required';
      if (formData.unit_price <= 0) errors.unit_price = 'Unit price must be greater than 0';
      if (formData.cost_price <= 0) errors.cost_price = 'Cost price must be greater than 0';
      if (formData.initial_stock < 0) errors.initial_stock = 'Initial stock cannot be negative';
      if (formData.reorder_level < 0) errors.reorder_level = 'Reorder level cannot be negative';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      
      const payload = {
        item_code: formData.item_code.trim(),
        item_name: formData.item_name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        unit_price: formData.unit_price,
        cost_price: formData.cost_price,
        initial_stock: formData.initial_stock,
        reorder_level: formData.reorder_level,
        supplier_info: {
          name: formData.supplier_name.trim() || undefined,
          contact: formData.supplier_contact.trim() || undefined,
          location: formData.supplier_location.trim() || undefined,
        },
        notes: formData.notes.trim() || undefined,
      };
      
      await unifiedApi.post('/api/v1/inventory/glasses', payload);
      setSuccess('Item created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error creating item:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to create item');
      }
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    
    try {
      setFormErrors({});
      
      // Validation
      const errors: Record<string, string> = {};
      if (!formData.item_name.trim()) errors.item_name = 'Item name is required';
      if (!formData.category) errors.category = 'Category is required';
      if (formData.unit_price <= 0) errors.unit_price = 'Unit price must be greater than 0';
      if (formData.cost_price <= 0) errors.cost_price = 'Cost price must be greater than 0';
      if (formData.reorder_level < 0) errors.reorder_level = 'Reorder level cannot be negative';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      
      const payload = {
        item_name: formData.item_name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        unit_price: formData.unit_price,
        cost_price: formData.cost_price,
        reorder_level: formData.reorder_level,
        supplier_info: {
          name: formData.supplier_name.trim() || undefined,
          contact: formData.supplier_contact.trim() || undefined,
          location: formData.supplier_location.trim() || undefined,
        },
        notes: formData.notes.trim() || undefined,
      };
      
      await unifiedApi.put(`/api/v1/inventory/glasses/${selectedItem.item_id}`, payload);
      setSuccess('Item updated successfully!');
      setEditDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error updating item:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to update item');
      }
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    
    try {
      setFormErrors({});
      
      // Validation
      const errors: Record<string, string> = {};
      if (stockAdjustmentData.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
      if (!stockAdjustmentData.reason.trim()) errors.reason = 'Reason is required';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      
      const payload = {
        item_id: selectedItem.item_id,
        adjustment_type: stockAdjustmentData.adjustment_type,
        quantity: stockAdjustmentData.quantity,
        reason: stockAdjustmentData.reason.trim(),
        reference_document: stockAdjustmentData.reference_document.trim() || undefined,
        notes: stockAdjustmentData.notes.trim() || undefined,
      };
      
      await unifiedApi.post(`/api/v1/inventory/glasses/${selectedItem.item_id}/adjust-stock`, payload);
      setSuccess('Stock adjusted successfully!');
      setStockDialogOpen(false);
      resetStockForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to adjust stock');
      }
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      // Soft delete by setting is_active to false
      await unifiedApi.put(`/api/v1/inventory/glasses/${selectedItem.item_id}`, {
        is_active: false
      });
      setSuccess('Item deleted successfully!');
      setDeleteDialogOpen(false);
      fetchInventory();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to delete item');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      item_code: '',
      item_name: '',
      category: '',
      brand: '',
      model: '',
      unit_price: 0,
      cost_price: 0,
      initial_stock: 0,
      reorder_level: 0,
      supplier_name: '',
      supplier_contact: '',
      supplier_location: '',
      notes: '',
    });
    setFormErrors({});
  };

  const resetStockForm = () => {
    setStockAdjustmentData({
      adjustment_type: 'in',
      quantity: 0,
      reason: '',
      reference_document: '',
      notes: '',
    });
    setFormErrors({});
  };

  const openEditDialog = (item: GlassesItem) => {
    setSelectedItem(item);
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      initial_stock: item.current_stock,
      reorder_level: item.reorder_level,
      supplier_name: item.supplier_info?.name || '',
      supplier_contact: item.supplier_info?.contact || '',
      supplier_location: item.supplier_info?.location || '',
      notes: item.notes || '',
    });
    setEditDialogOpen(true);
  };

  const openStockDialog = (item: GlassesItem) => {
    setSelectedItem(item);
    setStockAdjustmentData({
      adjustment_type: 'in',
      quantity: 0,
      reason: '',
      reference_document: '',
      notes: '',
    });
    setStockDialogOpen(true);
  };

  const openViewDialog = (item: GlassesItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const openDeleteDialog = (item: GlassesItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
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

  // Breadcrumb navigation
  const breadcrumbs = [
    <Link
      key="1"
      color="inherit"
      href="/dashboard"
      onClick={(e) => {
        e.preventDefault();
        navigate('/dashboard');
      }}
      sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
    >
      <Home sx={{ mr: 0.5 }} fontSize="inherit" />
      Dashboard
    </Link>,
    <Link
      key="2"
      color="inherit"
      href="/dashboard/glasses-management"
      onClick={(e) => {
        e.preventDefault();
        navigate('/dashboard/glasses-management');
      }}
      sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
    >
      <MedicalServices sx={{ mr: 0.5 }} fontSize="inherit" />
      Glasses Management
    </Link>,
    <Typography key="3" color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
      <Inventory sx={{ mr: 0.5 }} fontSize="inherit" />
      {mode === 'inventory' ? 'Inventory Management' : 'Delivery Management'}
    </Typography>,
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>

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
          {mode === 'inventory' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Add New Item
            </Button>
          )}
        </Box>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
                    <TableCell>Actions</TableCell>
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
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => openViewDialog(item)}
                              color="info"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Item">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(item)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Adjust Stock">
                            <IconButton
                              size="small"
                              onClick={() => openStockDialog(item)}
                              color="warning"
                            >
                              <TrendingUp />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Item">
                            <IconButton
                              size="small"
                              onClick={() => openDeleteDialog(item)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
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
                      <TableCell>Patient Name</TableCell>
                      <TableCell>Patient CID</TableCell>
                      <TableCell>School</TableCell>
                      <TableCell>Delivery Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Delivered By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.delivery_id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {typeof delivery.patient_name === 'object' ? (delivery.patient_name as any).en : delivery.patient_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {delivery.patient_cid}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {typeof delivery.school_name === 'object' ? (delivery.school_name as any).en : (delivery.school_name || '-')}
                          </Typography>
                        </TableCell>
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
                        <TableCell>
                          <Typography variant="body2">
                            {typeof delivery.delivery_method === 'object' ? (delivery.delivery_method as any).en : (delivery.delivery_method || '-')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {typeof delivery.delivered_by === 'object' ? (delivery.delivered_by as any).en : (delivery.delivered_by || '-')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  // For delivery mode, we'll show delivery details instead of item details
                                  setSelectedDelivery(delivery);
                                  setSelectedItem(null);
                                  setViewDialogOpen(true);
                                }}
                                color="info"
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
            )
          )}
        </CardContent>
      </Card>

      {/* Create Item Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                error={!!formErrors.item_code}
                helperText={formErrors.item_code}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                error={!!formErrors.item_name}
                helperText={formErrors.item_name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Price (THB)"
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                error={!!formErrors.unit_price}
                helperText={formErrors.unit_price}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost Price (THB)"
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                error={!!formErrors.cost_price}
                helperText={formErrors.cost_price}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Initial Stock"
                type="number"
                value={formData.initial_stock}
                onChange={(e) => setFormData({ ...formData, initial_stock: parseInt(e.target.value) || 0 })}
                error={!!formErrors.initial_stock}
                helperText={formErrors.initial_stock}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reorder Level"
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                error={!!formErrors.reorder_level}
                helperText={formErrors.reorder_level}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Supplier Contact"
                value={formData.supplier_contact}
                onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Supplier Location"
                value={formData.supplier_location}
                onChange={(e) => setFormData({ ...formData, supplier_location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateItem} variant="contained">
            Create Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={formData.item_code}
                disabled
                helperText="Item code cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                error={!!formErrors.item_name}
                helperText={formErrors.item_name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Price (THB)"
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                error={!!formErrors.unit_price}
                helperText={formErrors.unit_price}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost Price (THB)"
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                error={!!formErrors.cost_price}
                helperText={formErrors.cost_price}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={formData.initial_stock}
                disabled
                helperText="Use 'Adjust Stock' to change stock levels"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reorder Level"
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                error={!!formErrors.reorder_level}
                helperText={formErrors.reorder_level}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Supplier Contact"
                value={formData.supplier_contact}
                onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Supplier Location"
                value={formData.supplier_location}
                onChange={(e) => setFormData({ ...formData, supplier_location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateItem} variant="contained">
            Update Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock - {selectedItem?.item_name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Current Stock: <strong>{selectedItem?.current_stock}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Adjustment Type</InputLabel>
                <Select
                  value={stockAdjustmentData.adjustment_type}
                  onChange={(e) => setStockAdjustmentData({ ...stockAdjustmentData, adjustment_type: e.target.value as any })}
                  label="Adjustment Type"
                >
                  <MenuItem value="in">Stock In (+)</MenuItem>
                  <MenuItem value="out">Stock Out (-)</MenuItem>
                  <MenuItem value="adjustment">Stock Adjustment (=)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={stockAdjustmentData.quantity}
                onChange={(e) => setStockAdjustmentData({ ...stockAdjustmentData, quantity: parseInt(e.target.value) || 0 })}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={stockAdjustmentData.reason}
                onChange={(e) => setStockAdjustmentData({ ...stockAdjustmentData, reason: e.target.value })}
                error={!!formErrors.reason}
                helperText={formErrors.reason}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference Document"
                value={stockAdjustmentData.reference_document}
                onChange={(e) => setStockAdjustmentData({ ...stockAdjustmentData, reference_document: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={stockAdjustmentData.notes}
                onChange={(e) => setStockAdjustmentData({ ...stockAdjustmentData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustStock} variant="contained">
            Adjust Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Item/Delivery Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'inventory' 
            ? `Item Details - ${selectedItem?.item_name}` 
            : `Delivery Details - ${selectedDelivery ? (typeof selectedDelivery.patient_name === 'object' ? (selectedDelivery.patient_name as any).en : selectedDelivery.patient_name) : ''}`
          }
        </DialogTitle>
        <DialogContent>
          {mode === 'inventory' && selectedItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Item Code</Typography>
                <Typography variant="body1">{selectedItem.item_code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Item Name</Typography>
                <Typography variant="body1">{selectedItem.item_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Chip label={selectedItem.category} size="small" color="primary" variant="outlined" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Brand</Typography>
                <Typography variant="body1">{selectedItem.brand || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Model</Typography>
                <Typography variant="body1">{selectedItem.model || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Stock</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedItem.current_stock}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Reorder Level</Typography>
                <Typography variant="body1">{selectedItem.reorder_level}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Unit Price</Typography>
                <Typography variant="body1">฿{selectedItem.unit_price.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Cost Price</Typography>
                <Typography variant="body1">฿{selectedItem.cost_price.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={getStatusText(selectedItem.current_stock, selectedItem.reorder_level)}
                  size="small"
                  color={getStatusColor(selectedItem.current_stock, selectedItem.reorder_level) as any}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Active</Typography>
                <FormControlLabel
                  control={<Switch checked={selectedItem.is_active} disabled />}
                  label={selectedItem.is_active ? 'Active' : 'Inactive'}
                />
              </Grid>
              {selectedItem.supplier_info && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" gutterBottom>Supplier Information</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedItem.supplier_info.name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                    <Typography variant="body1">{selectedItem.supplier_info.contact || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                    <Typography variant="body1">{selectedItem.supplier_info.location || '-'}</Typography>
                  </Grid>
                </>
              )}
              {selectedItem.notes && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" gutterBottom>Notes</Typography>
                    <Typography variant="body1">{selectedItem.notes}</Typography>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Timestamps</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">{new Date(selectedItem.created_at).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                <Typography variant="body1">{new Date(selectedItem.updated_at).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          )}
          
          {mode === 'delivery' && selectedDelivery && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Patient Name</Typography>
                <Typography variant="body1">
                  {typeof selectedDelivery.patient_name === 'object' ? (selectedDelivery.patient_name as any).en : selectedDelivery.patient_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Patient CID</Typography>
                <Typography variant="body1">{selectedDelivery.patient_cid}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">School</Typography>
                <Typography variant="body1">
                  {typeof selectedDelivery.school_name === 'object' ? (selectedDelivery.school_name as any).en : (selectedDelivery.school_name || '-')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Delivery Date</Typography>
                <Typography variant="body1">{new Date(selectedDelivery.delivery_date).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedDelivery.delivery_status}
                  size="small"
                  color={getDeliveryStatusColor(selectedDelivery.delivery_status) as any}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Delivery Method</Typography>
                <Typography variant="body1">
                  {typeof selectedDelivery.delivery_method === 'object' ? (selectedDelivery.delivery_method as any).en : (selectedDelivery.delivery_method || '-')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Delivered By</Typography>
                <Typography variant="body1">
                  {typeof selectedDelivery.delivered_by === 'object' ? (selectedDelivery.delivered_by as any).en : (selectedDelivery.delivered_by || '-')}
                </Typography>
              </Grid>
              {selectedDelivery.notes && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" gutterBottom>Notes</Typography>
                    <Typography variant="body1">{selectedDelivery.notes}</Typography>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Timestamps</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">{new Date(selectedDelivery.created_at).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                <Typography variant="body1">{new Date(selectedDelivery.updated_at).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedItem?.item_name}"? This action will deactivate the item.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteItem} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Box>
  );
};

export default GlassesInventoryManagerEnhanced;
