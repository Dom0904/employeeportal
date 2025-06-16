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

      {/* Add/Edit/Delete Dialogs would go here, omitted for brevity */}
    </Box>
  );
};

export default Inventory; 