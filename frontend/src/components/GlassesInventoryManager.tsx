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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Inventory,
  Add,
  Edit,
  Visibility,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  LocalShipping,
  Assessment,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface GlassesInventoryManagerProps {
  onItemCreated?: (item: any) => void;
  onStockAdjusted?: (adjustment: any) => void;
}

interface GlassesItem {
  item_id: string;
  item_code: string;
  item_name: string;
  category: string;
  brand?: string;
  model?: string;
  specifications?: any;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  reorder_level: number;
  supplier_info?: any;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StockAdjustment {
  item_id: string;
  adjustment_type: string;
  quantity: number;
  reason: string;
  reference_document?: string;
  notes?: string;
}

const GlassesInventoryManager: React.FC<GlassesInventoryManagerProps> = ({
  onItemCreated,
  onStockAdjusted
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data state
  const [items, setItems] = useState<GlassesItem[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<GlassesItem[]>([]);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GlassesItem | null>(null);

  // Create form state
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [notes, setNotes] = useState('');

  // Adjustment form state
  const [adjustmentType, setAdjustmentType] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadInventory();
    loadStatistics();
    loadLowStockItems();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await axios.get('/api/v1/inventory/glasses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data || []);
    } catch (err: any) {
      setError('Failed to load inventory');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get('/api/v1/inventory/glasses/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (err: any) {
      setError('Failed to load statistics');
    }
  };

  const loadLowStockItems = async () => {
    try {
      const response = await axios.get('/api/v1/inventory/glasses/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockItems(response.data.low_stock_items || []);
    } catch (err: any) {
      setError('Failed to load low stock items');
    }
  };

  const handleCreateItem = async () => {
    if (!itemCode || !itemName || !category || !unitPrice || !costPrice || !initialStock || !reorderLevel) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemData = {
        item_code: itemCode,
        item_name: itemName,
        category: category,
        brand: brand || undefined,
        model: model || undefined,
        unit_price: parseFloat(unitPrice),
        cost_price: parseFloat(costPrice),
        initial_stock: parseInt(initialStock),
        reorder_level: parseInt(reorderLevel),
        notes: notes || undefined
      };

      const response = await axios.post(
        '/api/v1/inventory/glasses',
        itemData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Item created successfully!');
      setShowCreateForm(false);
      resetCreateForm();
      loadInventory();
      loadStatistics();
      if (onItemCreated) {
        onItemCreated(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustmentType || !adjustmentQuantity || !adjustmentReason) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adjustmentData = {
        item_id: selectedItem.item_id,
        adjustment_type: adjustmentType,
        quantity: parseInt(adjustmentQuantity),
        reason: adjustmentReason,
        notes: adjustmentNotes || undefined
      };

      const response = await axios.post(
        `/api/v1/inventory/glasses/${selectedItem.item_id}/adjust-stock`,
        adjustmentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Stock adjusted successfully!');
      setShowAdjustmentForm(false);
      resetAdjustmentForm();
      loadInventory();
      loadStatistics();
      loadLowStockItems();
      if (onStockAdjusted) {
        onStockAdjusted(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setItemCode('');
    setItemName('');
    setCategory('');
    setBrand('');
    setModel('');
    setUnitPrice('');
    setCostPrice('');
    setInitialStock('');
    setReorderLevel('');
    setNotes('');
  };

  const resetAdjustmentForm = () => {
    setAdjustmentType('');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setAdjustmentNotes('');
    setSelectedItem(null);
  };

  const getStockStatusColor = (currentStock: number, reorderLevel: number) => {
    if (currentStock === 0) return 'error';
    if (currentStock <= reorderLevel) return 'warning';
    return 'success';
  };

  const getStockStatusText = (currentStock: number, reorderLevel: number) => {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'frames':
        return 'primary';
      case 'lenses':
        return 'secondary';
      case 'accessories':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                <Inventory sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total Items
              </Typography>
              <Typography variant="h4">
                {statistics?.total_items || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                Low Stock
              </Typography>
              <Typography variant="h4">
                {statistics?.low_stock_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                <Error sx={{ mr: 1, verticalAlign: 'middle' }} />
                Out of Stock
              </Typography>
              <Typography variant="h4">
                {statistics?.out_of_stock_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total Value
              </Typography>
              <Typography variant="h4">
                ฿{(statistics?.total_inventory_value || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Low Stock Alert: {lowStockItems.length} items need reordering
          </Typography>
          <List dense>
            {lowStockItems.slice(0, 3).map((item) => (
              <ListItem key={item.item_id}>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={item.item_name}
                  secondary={`Current: ${item.current_stock}, Reorder Level: ${item.reorder_level}`}
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
          Add New Item
        </Button>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => {
            loadStatistics();
            loadLowStockItems();
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

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Inventory sx={{ mr: 1, verticalAlign: 'middle' }} />
            Glasses Inventory
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell>{item.item_code}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.category}
                        color={getCategoryColor(item.category) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.brand || '-'}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={getStockStatusColor(item.current_stock, item.reorder_level)}
                      >
                        {item.current_stock}
                      </Typography>
                    </TableCell>
                    <TableCell>฿{item.unit_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStockStatusText(item.current_stock, item.reorder_level)}
                        color={getStockStatusColor(item.current_stock, item.reorder_level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAdjustmentForm(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Item Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                  <MenuItem value="frames">Frames</MenuItem>
                  <MenuItem value="lenses">Lenses</MenuItem>
                  <MenuItem value="accessories">Accessories</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Price (THB)"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost Price (THB)"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Initial Stock"
                type="number"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reorder Level"
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                required
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
            onClick={handleCreateItem}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentForm} onClose={() => setShowAdjustmentForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1">
                Item: {selectedItem.item_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Stock: {selectedItem.current_stock} | Reorder Level: {selectedItem.reorder_level}
              </Typography>
            </Paper>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Adjustment Type</InputLabel>
                <Select value={adjustmentType} label="Adjustment Type" onChange={(e) => setAdjustmentType(e.target.value)}>
                  <MenuItem value="in">Stock In</MenuItem>
                  <MenuItem value="out">Stock Out</MenuItem>
                  <MenuItem value="adjustment">Stock Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdjustmentForm(false)}>Cancel</Button>
          <Button
            onClick={handleAdjustStock}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Edit />}
          >
            {loading ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GlassesInventoryManager;
