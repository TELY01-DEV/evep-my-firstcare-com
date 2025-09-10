import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Fab,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Inventory,
  LocalShipping,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Search,
  FilterList,
  AddShoppingCart,
  RemoveShoppingCart,
  Assessment,
  TrendingUp,
  TrendingDown,
  Visibility as GlassesIcon,
  Category,
  ColorLens,
  Straighten,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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

interface GlassesInventoryManagerProps {
  mode?: 'inventory' | 'delivery';
}

const GlassesInventoryManager: React.FC<GlassesInventoryManagerProps> = ({ mode = 'inventory' }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<GlassesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<GlassesItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: '',
    brand: '',
    model: '',
    specifications: {
      frame_color: '',
      lens_type: '',
      prescription_range: '',
      size: '',
      material: '',
    },
    initial_stock: 0,
    reorder_level: 5,
    unit_price: 0,
    cost_price: 0,
    supplier_info: {
      name: '',
      contact: '',
      location: '',
    },
    notes: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('evep_token');
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/inventory/glasses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not wrapped in {items: []}
        setItems(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch inventory from API:', response.status, response.statusText);
        setItems([]);
        setSnackbar({
          open: true,
          message: `Failed to fetch inventory: ${response.status} ${response.statusText}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching inventory data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      item_code: '',
      item_name: '',
      category: '',
      brand: '',
      model: '',
      specifications: {
        frame_color: '',
        lens_type: '',
        prescription_range: '',
        size: '',
        material: '',
      },
      initial_stock: 0,
      reorder_level: 5,
      unit_price: 0,
      cost_price: 0,
      supplier_info: {
        name: '',
        contact: '',
        location: '',
      },
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleEditItem = (item: GlassesItem) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      specifications: {
        frame_color: item.specifications?.frame_color || '',
        lens_type: item.specifications?.lens_type || '',
        prescription_range: item.specifications?.prescription_range || '',
        size: item.specifications?.size || '',
        material: item.specifications?.material || '',
      },
      initial_stock: item.current_stock,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      supplier_info: {
        name: item.supplier_info?.name || '',
        contact: item.supplier_info?.contact || '',
        location: item.supplier_info?.location || '',
      },
      notes: item.notes || '',
    });
    setOpenDialog(true);
  };

  const handleSaveItem = async () => {
    try {
      const token = localStorage.getItem('evep_token');
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const url = editingItem 
        ? `${baseUrl}/api/v1/inventory/glasses/${editingItem.item_id}`
        : `${baseUrl}/api/v1/inventory/glasses`;
      
      // Transform formData to match backend API requirements
      const apiData = {
        item_code: formData.item_code,
        item_name: formData.item_name,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        specifications: {
          frame_color: formData.specifications.frame_color,
          lens_type: formData.specifications.lens_type,
          prescription_range: formData.specifications.prescription_range,
          size: formData.specifications.size,
          material: formData.specifications.material
        },
        unit_price: formData.unit_price,
        cost_price: formData.unit_price * 0.7, // Estimate cost price as 70% of unit price
        initial_stock: formData.quantity,
        reorder_level: formData.min_quantity,
        supplier_info: {
          name: formData.supplier,
          location: formData.location
        },
        notes: `${formData.frame_color} ${formData.lens_type} ${formData.size} ${formData.material}`
      };
      
      console.log('Sending data to API:', apiData);
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Item ${editingItem ? 'updated' : 'added'} successfully!`,
          severity: 'success'
        });
        setOpenDialog(false);
        fetchInventory();
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw `Failed to save item: ${errorData.detail || 'Unknown error'}`;
      }
    } catch (error) {
      console.error('Error saving item:', error);
      setSnackbar({
        open: true,
        message: 'Error saving item',
        severity: 'error'
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('evep_token');
        const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
        const response = await fetch(`${baseUrl}/api/v1/inventory/glasses/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setSnackbar({
            open: true,
            message: 'Item deleted successfully!',
            severity: 'success'
          });
          fetchInventory();
        } else {
          throw 'Failed to delete item';
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting item',
          severity: 'error'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'success';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'error';
      case 'discontinued':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle />;
      case 'low_stock':
        return <Warning />;
      case 'out_of_stock':
        return <Error />;
      case 'discontinued':
        return <Visibility />;
      default:
        return <Visibility />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    // Determine status based on stock levels
    let itemStatus = 'in_stock';
    if (item.current_stock === 0) {
      itemStatus = 'out_of_stock';
    } else if (item.current_stock <= item.reorder_level) {
      itemStatus = 'low_stock';
    }
    
    const matchesStatus = filterStatus === 'all' || itemStatus === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getInventoryStats = () => {
    const totalItems = items.length;
    const inStock = items.filter(item => item.current_stock > item.reorder_level).length;
    const lowStock = items.filter(item => item.current_stock > 0 && item.current_stock <= item.reorder_level).length;
    const outOfStock = items.filter(item => item.current_stock === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0);

    return { totalItems, inStock, lowStock, outOfStock, totalValue };
  };

  const stats = getInventoryStats();

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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddItem}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          Add New Item
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4">
                {stats.totalItems}
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
                {stats.inStock}
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
                {stats.lowStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4" color="primary.main">
                ฿{stats.totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
                             <TextField
                 fullWidth
                 label="Search Items"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 InputProps={{
                   startAdornment: <Search />
                 }}
               />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="Children">Children</MenuItem>
                  <MenuItem value="Teen">Teen</MenuItem>
                  <MenuItem value="Adult">Adult</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="in_stock">In Stock</MenuItem>
                  <MenuItem value="low_stock">Low Stock</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchInventory}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  // Determine status based on stock levels
                  let itemStatus = 'in_stock';
                  if (item.current_stock === 0) {
                    itemStatus = 'out_of_stock';
                  } else if (item.current_stock <= item.reorder_level) {
                    itemStatus = 'low_stock';
                  }
                  
                  return (
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
                          <Typography variant="body2" color="text.secondary">
                            {item.model} • {item.specifications?.frame_color}
                          </Typography>
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
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {item.current_stock}
                          </Typography>
                          {item.current_stock <= item.reorder_level && (
                            <Warning color="warning" fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(itemStatus)}
                          label={itemStatus.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(itemStatus) as any}
                        />
                      </TableCell>
                      <TableCell>฿{item.unit_price.toLocaleString()}</TableCell>
                      <TableCell>{item.supplier_info?.location}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Item">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Item">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteItem(item.item_id)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Glasses Item' : 'Add New Glasses Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="Children">Children</MenuItem>
                  <MenuItem value="Teen">Teen</MenuItem>
                  <MenuItem value="Adult">Adult</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Frame Color"
                value={formData.frame_color}
                onChange={(e) => setFormData({ ...formData, frame_color: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lens Type"
                value={formData.lens_type}
                onChange={(e) => setFormData({ ...formData, lens_type: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prescription Range"
                value={formData.prescription_range}
                onChange={(e) => setFormData({ ...formData, prescription_range: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Price (฿)"
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editingItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default GlassesInventoryManager;
