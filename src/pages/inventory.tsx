import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { InventoryItem, InventoryStatus } from '../types/Inventory';

interface InventoryFormData extends Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'> {
  unit?: string;
  category?: string;
  supplier?: string;
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
  const { /* user */ } = useAuth();
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
    unit: '',
    category: '',
    supplier: '',
    status: 'in-stock',
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    try {
      const newItem: Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'> = {
        product_id: formData.product_id,
        product_name: formData.product_name,
        description: formData.description,
        unit_price: formData.unit_price,
        quantity: formData.quantity,
        status: formData.status,
        unit: formData.unit,
        category: formData.category,
        supplier: formData.supplier,
      };
      await addItem(newItem);
      setIsAddDialogOpen(false);
      setFormData({
        product_id: '',
        product_name: '',
        description: '',
        unit_price: 0,
        quantity: 0,
        unit: '',
        category: '',
        supplier: '',
        status: 'in-stock',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    try {
      await editItem(selectedItem.id, formData);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit item');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteItem(selectedItem.id, password);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      product_id: item.product_id,
      product_name: item.product_name,
      description: item.description || '',
      unit_price: item.unit_price || 0,
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category || '',
      supplier: item.supplier || '',
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
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
                <TableCell>{item.product_id}</TableCell>
                <TableCell>{item.product_name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell align="right">${item.unit_price ? item.unit_price.toFixed(2) : 'N/A'}</TableCell>
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
                    <IconButton
                      onClick={() => openDeleteDialog(item)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Product ID"
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value })
              }
            />
            <TextField
              label="Product Name"
              value={formData.product_name}
              onChange={(e) =>
                setFormData({ ...formData, product_name: e.target.value })
              }
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
            />
            <TextField
              label="Unit Price"
              type="number"
              value={formData.unit_price}
              onChange={(e) =>
                setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
              }
              inputProps={{
                step: "0.01",
              }}
            />
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
            />
            <TextField
              select
              label="Unit"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              <option value="pcs">Pcs</option>
              <option value="M">M</option>
              <option value="rolls">Rolls</option>
              <option value="assembly">Assembly</option>
              <option value="sacks">Sacks</option>
              <option value="Kg">Kg</option>
              <option value="pack">Pack</option>
              <option value="crate">Crate</option>
              <option value="lengths">Lengths</option>
            </TextField>
            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              <option value="electrical">Electrical</option>
              <option value="mechanical">Mechanical</option>
              <option value="hvac">HVAC</option>
              <option value="sanitary">Sanitary</option>
              <option value="trading-goods">Trading Goods</option>
              <option value="finished-goods">Finished Goods</option>
              <option value="fabricated">Fabricated</option>
              <option value="aux-electronics">AUX Electronics</option>
            </TextField>
            <TextField
              label="Supplier"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
            />
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as InventoryStatus,
                })
              }
              SelectProps={{ native: true }}
            >
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="restock">Restock</option>
              <option value="low-stock">Low Stock</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Product ID"
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value })
              }
            />
            <TextField
              label="Product Name"
              value={formData.product_name}
              onChange={(e) =>
                setFormData({ ...formData, product_name: e.target.value })
              }
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
            />
            <TextField
              label="Unit Price"
              type="number"
              value={formData.unit_price}
              onChange={(e) =>
                setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
              }
              inputProps={{
                step: "0.01",
              }}
            />
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
            />
            <TextField
              select
              label="Unit"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              <option value="pcs">Pcs</option>
              <option value="M">M</option>
              <option value="rolls">Rolls</option>
              <option value="assembly">Assembly</option>
              <option value="sacks">Sacks</option>
              <option value="Kg">Kg</option>
              <option value="pack">Pack</option>
              <option value="crate">Crate</option>
              <option value="lengths">Lengths</option>
            </TextField>
            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              <option value="electrical">Electrical</option>
              <option value="mechanical">Mechanical</option>
              <option value="hvac">HVAC</option>
              <option value="sanitary">Sanitary</option>
              <option value="trading-goods">Trading Goods</option>
              <option value="finished-goods">Finished Goods</option>
              <option value="fabricated">Fabricated</option>
              <option value="aux-electronics">AUX Electronics</option>
            </TextField>
            <TextField
              label="Supplier"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
            />
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as InventoryStatus,
                })
              }
              SelectProps={{ native: true }}
            >
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="restock">Restock</option>
              <option value="low-stock">Low Stock</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Typography>
              Are you sure you want to delete{' '}
              <strong>{selectedItem?.product_name}</strong>?
            </Typography>
            <Typography color="error" variant="body2">
              This action cannot be undone. Please enter your password to confirm.
            </Typography>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              helperText={error}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;