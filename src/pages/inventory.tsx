import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { useNotifications } from '../contexts/NotificationContext';
import { InventoryItem, InventoryStatus } from '../types/Inventory';
import { CATEGORIES, UNITS } from '../constants/inventoryConstants';

interface InventoryFormData extends Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'> {
  unit?: string | null;
  category?: string | null;
  supplier?: string | null;
}

const getStatusColor = (status: InventoryStatus) => {
  switch (status) {
    case 'in-stock':
      return 'success';
    case 'out-of-stock':
      return 'error';
    case 'restock':
      return 'warning';
    case 'low-stock':
      return 'info';
    default:
      return 'default';
  }
};

const Inventory = () => {
  const { items, addItem, editItem, deleteItem } = useInventory();
  const { user } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    product_id: '',
    product_name: '',
    description: '',
    unit_price: 0,
    quantity: 0,
    unit: null, // Initialize with null
    category: null, // Initialize with null
    supplier: null,
    status: 'in-stock',
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Only allow managers, supervisors, or admins
  const allowedRoles = [UserRole.MANAGER, UserRole.MODERATOR, UserRole.ADMIN];
  if (!user || !allowedRoles.includes(user.role)) {
    router.push('/dashboard');
    return null;
  }

  const handleAdd = async () => {
    try {
      await addItem(formData);
      setIsAddDialogOpen(false);
      setFormData({
        product_id: '',
        product_name: '',
        description: '',
        unit_price: 0,
        quantity: 0,
        unit: null,
        category: null,
        supplier: null,
        status: 'in-stock',
      });
      showNotification({ type: 'success', message: 'Item added successfully' });
    } catch (error) {
      showNotification({ type: 'error', message: 'Failed to add item' });
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    try {
      await editItem(selectedItem.id, {
        ...formData,
        unit: formData.unit || null,
        category: formData.category || null,
        supplier: formData.supplier || null,
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      showNotification({ type: 'success', message: 'Item updated successfully' });
    } catch (error) {
      showNotification({ type: 'error', message: 'Failed to update item' });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteItem(selectedItem.id, password);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      setPassword('');
      showNotification({ type: 'success', message: 'Item deleted successfully' });
    } catch (error) {
      showNotification({ type: 'error', message: 'Failed to delete item' });
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      product_id: item.product_id || '',
      product_name: item.product_name || '',
      description: item.description || '',
      unit_price: item.unit_price || 0,
      quantity: item.quantity,
      unit: item.unit || null,
      category: item.category || null,
      supplier: item.supplier || null,
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product ID</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product_id || ''}</TableCell>
                <TableCell>{item.product_name || ''}</TableCell>
                <TableCell>{item.description || ''}</TableCell>
                <TableCell>{item.unit || ''}</TableCell>
                <TableCell>{item.category || ''}</TableCell>
                <TableCell>{item.supplier || ''}</TableCell>
                <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status.replace('-', ' ').toUpperCase()}
                    color={getStatusColor(item.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => openEditDialog(item)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => openDeleteDialog(item)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product ID"
            type="text"
            fullWidth
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Product Name"
            type="text"
            fullWidth
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Unit Price"
            type="number"
            fullWidth
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Unit</InputLabel>
            <Select
              value={String(formData.unit || '')}
              label="Unit"
              onChange={(e) => setFormData({ ...formData, unit: e.target.value || null })}
            >
              <MenuItem value="">None</MenuItem>
              {UNITS.map((unitOption) => (
                <MenuItem key={unitOption} value={unitOption}>{unitOption}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={String(formData.category || '')}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
            >
              <MenuItem value="">None</MenuItem>
              {CATEGORIES.map((catOption) => (
                <MenuItem key={catOption} value={catOption}>{catOption}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Supplier"
            type="text"
            fullWidth
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product ID"
            type="text"
            fullWidth
            value={selectedItem?.product_id || ''}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            disabled
          />
          <TextField
            margin="dense"
            label="Product Name"
            type="text"
            fullWidth
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Unit Price"
            type="number"
            fullWidth
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Unit</InputLabel>
            <Select
              value={String(formData.unit || '')}
              label="Unit"
              onChange={(e) => setFormData({ ...formData, unit: e.target.value || null })}
            >
              <MenuItem value="">None</MenuItem>
              {UNITS.map((unitOption) => (
                <MenuItem key={unitOption} value={unitOption}>{unitOption}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={String(formData.category || '')}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
            >
              <MenuItem value="">None</MenuItem>
              {CATEGORIES.map((catOption) => (
                <MenuItem key={catOption} value={catOption}>{catOption}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Supplier"
            type="text"
            fullWidth
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Delete Inventory Item</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{selectedItem?.product_name}"?</Typography>
          <TextField
            margin="dense"
            label="Admin Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;