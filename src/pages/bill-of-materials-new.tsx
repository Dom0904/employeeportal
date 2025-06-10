import React, { useState } from 'react';

import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton, MenuItem, Select, TextField, Stack } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Download as DownloadIcon, PictureAsPdf as PdfIcon, Save as SaveIcon } from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useBOM } from '../contexts/BOMContext';
import { BOMItem } from '../types/BOM';

const BillOfMaterial: React.FC = () => {
  const { items: inventoryItems } = useInventory();
  const { user } = useAuth();
  const { addBOM, exportBOMToPDF } = useBOM();
  const isAdminOrManager = user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER);

  // BOM state for this session
  const [bomRows, setBomRows] = useState<BOMItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');

  // Add a new empty row
  const handleAddRow = () => {
    setBomRows([...bomRows, { id: crypto.randomUUID(), inventoryitemid: '', quantity: 1 }]);
  };

  // Remove a row
  const handleRemoveRow = (id: string) => {
    setBomRows(bomRows.filter(row => row.id !== id));
  };

  // Update a row
  const handleRowChange = (id: string, field: keyof BOMItem, value: any) => {
    setBomRows(bomRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // Save BOM
  const handleSave = async () => {
    if (!title) {
      alert('Please enter a title for the BOM');
      return;
    }
    if (bomRows.length === 0) {
      alert('Please add at least one item to the BOM');
      return;
    }
    try {
      await addBOM({
        title,
        description,
        projectId,
        items: bomRows
      });
      // Reset form
      setTitle('');
      setDescription('');
      setProjectId('');
      setBomRows([]);
    } catch (error) {
      console.error('Failed to save BOM:', error);
      alert('Failed to save BOM. Please try again.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Item No.', 'Item Name', 'Quantity'];
    if (isAdminOrManager) headers.push('Available Stock');
    const rows = bomRows.map(row => {
      const item = inventoryItems.find(i => i.id === row.inventoryitemid);
      const base = [item?.product_id || '', item?.product_name || '', row.quantity.toString()];
      if (isAdminOrManager) base.push(item ? item.quantity.toString() : '');
      return base;
    });
    let csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOM-${title || 'Untitled'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 950, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Bill of Materials</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField 
            label="Title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            sx={{ flex: 1 }} 
            required
          />
          <TextField 
            label="Description" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            sx={{ flex: 2 }} 
          />
          <TextField 
            label="Project ID" 
            value={projectId} 
            onChange={e => setProjectId(e.target.value)} 
            sx={{ flex: 1 }} 
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item No.</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Quantity</TableCell>
              {isAdminOrManager && <TableCell>Available Stock</TableCell>}
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bomRows.map((row, idx) => {
              const item = inventoryItems.find(i => i.id === row.inventoryitemid);
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Select
                      value={row.inventoryitemid}
                      onChange={e => handleRowChange(row.id, 'inventoryitemid', e.target.value)}
                      displayEmpty
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value=""><em>Select</em></MenuItem>
                      {inventoryItems.map(inv => (
                        <MenuItem key={inv.id} value={inv.id}>{inv.product_id}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>{item?.product_name || ''}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={row.quantity}
                      onChange={e => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                      inputProps={{ min: 1 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  {isAdminOrManager && <TableCell>{item ? item.quantity : ''}</TableCell>}
                  <TableCell>
                    <IconButton color="error" onClick={() => handleRemoveRow(row.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={isAdminOrManager ? 5 : 4} align="center">
                <Button startIcon={<AddIcon />} onClick={handleAddRow} variant="outlined">Add Item</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />} 
            onClick={handleSave}
          >
            Save BOM
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
          >
            Export to CSV
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default BillOfMaterial; 