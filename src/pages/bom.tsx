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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  ImportExport as ImportIcon,
} from '@mui/icons-material';
import { useBOM } from '../contexts/BOMContext';
import { useInventory } from '../contexts/InventoryContext';
import { BOM, BOMItem } from '../types/BOM';
import { InventoryItem } from '../types/Inventory';

interface BOMFormData {
  title: string;
  description?: string;
  projectId?: string;
  items: BOMItem[];
}

const BOMPage = () => {
  const { boms, addBOM, updateBOM, deleteBOM, exportBOMToPDF, importBOMToCostEstimation } = useBOM();
  const { items: inventoryItems } = useInventory();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [formData, setFormData] = useState<BOMFormData>({
    title: '',
    description: '',
    projectId: '',
    items: [],
  });

  const handleAdd = async () => {
    try {
      await addBOM(formData);
      setIsAddDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        projectId: '',
        items: [],
      });
    } catch (err) {
      console.error('Failed to add BOM:', err);
    }
  };

  const handleEdit = async () => {
    if (!selectedBOM) return;
    try {
      await updateBOM(selectedBOM.id, formData);
      setIsEditDialogOpen(false);
      setSelectedBOM(null);
    } catch (err) {
      console.error('Failed to edit BOM:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBOM(id);
    } catch (err) {
      console.error('Failed to delete BOM:', err);
    }
  };

  const openEditDialog = (bom: BOM) => {
    setSelectedBOM(bom);
    setFormData({
      title: bom.title,
      description: bom.description,
      projectId: bom.projectId,
      items: bom.items,
    });
    setIsEditDialogOpen(true);
  };

  const getInventoryItemDetails = (itemId: string): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === itemId);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          inventoryItemId: '',
          quantity: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof BOMItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Bill of Materials</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Create BOM
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Project ID</TableCell>
              <TableCell>Items Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boms.map((bom) => (
              <TableRow key={bom.id}>
                <TableCell>{bom.title}</TableCell>
                <TableCell>{bom.projectId || '-'}</TableCell>
                <TableCell>{bom.items.length}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => openEditDialog(bom)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(bom.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export to PDF">
                    <IconButton
                      onClick={() => exportBOMToPDF(bom.id)}
                      size="small"
                      color="primary"
                    >
                      <PdfIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Import to Cost Estimation">
                    <IconButton
                      onClick={() => importBOMToCostEstimation(bom.id)}
                      size="small"
                      color="primary"
                    >
                      <ImportIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onClose={() => (isAddDialogOpen ? setIsAddDialogOpen(false) : setIsEditDialogOpen(false))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isAddDialogOpen ? 'Create Bill of Materials' : 'Edit Bill of Materials'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              label="Project ID"
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
            />

            <Typography variant="h6" sx={{ mt: 2 }}>
              Items
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Item
            </Button>

            {formData.items.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <TextField
                  select
                  label="Product"
                  value={item.inventoryItemId}
                  onChange={(e) =>
                    handleItemChange(index, 'inventoryItemId', e.target.value)
                  }
                  sx={{ flexGrow: 1 }}
                  SelectProps={{ native: true }}
                >
                  <option value="">Select a product</option>
                  {inventoryItems.map((invItem) => (
                    <option key={invItem.id} value={invItem.id}>
                      {invItem.productName} ({invItem.productId})
                    </option>
                  ))}
                </TextField>
                <TextField
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                  }
                  sx={{ width: 120 }}
                />
                <IconButton
                  onClick={() => handleRemoveItem(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              isAddDialogOpen ? setIsAddDialogOpen(false) : setIsEditDialogOpen(false)
            }
          >
            Cancel
          </Button>
          <Button
            onClick={isAddDialogOpen ? handleAdd : handleEdit}
            variant="contained"
          >
            {isAddDialogOpen ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BOMPage;
