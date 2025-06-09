import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Autocomplete,
  InputAdornment,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useInventory } from '../contexts/InventoryContext';
import { InventoryItem } from '../types/Inventory';

// Cost estimation item interface
interface CostEstimationItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

// Cost estimation template interface
interface CostEstimationTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  items: CostEstimationItem[];
  totalCost: number;
}

const CostEstimation = () => {
  // Mock inventory items
  // const [inventoryItems] = useState<InventoryItem[]>([
  //   { id: '1', name: 'Steel Pipe (1 inch)', description: '1 inch diameter steel pipe', unit: 'meter', unitPrice: 12.5, quantity: 500 },
  //   { id: '2', name: 'Steel Pipe (2 inch)', description: '2 inch diameter steel pipe', unit: 'meter', unitPrice: 18.75, quantity: 300 },
  //   { id: '3', name: 'Copper Wire', description: '12 gauge copper wire', unit: 'meter', unitPrice: 3.25, quantity: 1000 },
  //   { id: '4', name: 'Electrical Conduit', description: 'PVC electrical conduit', unit: 'meter', unitPrice: 5.5, quantity: 750 },
  //   { id: '5', name: 'Circuit Breaker', description: '20A circuit breaker', unit: 'piece', unitPrice: 15, quantity: 50 },
  //   { id: '6', name: 'Light Switch', description: 'Standard light switch', unit: 'piece', unitPrice: 4.5, quantity: 100 },
  //   { id: '7', name: 'Outlet', description: 'Standard electrical outlet', unit: 'piece', unitPrice: 3.75, quantity: 200 },
  //   { id: '8', name: 'LED Light Bulb', description: '10W LED light bulb', unit: 'piece', unitPrice: 6.5, quantity: 150 },
  // ]);

  const { items: inventoryItems } = useInventory();

  // Cost estimation state
  const [estimationItems, setEstimationItems] = useState<CostEstimationItem[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  
  // Templates state
  const [templates, setTemplates] = useState<CostEstimationTemplate[]>([]);
  const [openSaveDialog, setOpenSaveDialog] = useState<boolean>(false);
  const [openLoadDialog, setOpenLoadDialog] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Calculate total cost whenever estimation items change
  useEffect(() => {
    const newTotal = estimationItems.reduce((sum, item) => sum + item.total, 0);
    setTotalCost(newTotal);
  }, [estimationItems]);

  // Add item to estimation
  const handleAddItem = () => {
    if (!selectedItem) return;
    
    if (itemQuantity <= 0) {
      setSnackbarMessage('Quantity must be greater than zero');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    const newItem: CostEstimationItem = {
      id: `item-${Date.now()}`,
      itemId: selectedItem.id,
      name: selectedItem.product_name,
      description: selectedItem.description,
      unit: selectedItem.unit,
      unitPrice: selectedItem.unitPrice,
      quantity: itemQuantity,
      total: selectedItem.unitPrice * itemQuantity
    };
    
    setEstimationItems(prev => [...prev, newItem]);
    setSelectedItem(null);
    setItemQuantity(1);
  };

  // Remove item from estimation
  const handleRemoveItem = (itemId: string) => {
    setEstimationItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setEstimationItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total: item.unitPrice * newQuantity } 
          : item
      )
    );
  };

  // Open save template dialog
  const handleSaveDialogOpen = () => {
    if (estimationItems.length === 0) {
      setSnackbarMessage('Cannot save an empty estimation');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setOpenSaveDialog(true);
  };

  // Close save template dialog
  const handleSaveDialogClose = () => {
    setOpenSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!templateName) {
      setSnackbarMessage('Template name is required');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    const newTemplate: CostEstimationTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      createdAt: new Date().toISOString(),
      items: [...estimationItems],
      totalCost
    };
    
    // In a real app, this would save to Supabase
    setTemplates(prev => [...prev, newTemplate]);
    handleSaveDialogClose();
    
    setSnackbarMessage('Template saved successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Open load template dialog
  const handleLoadDialogOpen = () => {
    if (templates.length === 0) {
      setSnackbarMessage('No saved templates available');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setOpenLoadDialog(true);
  };

  // Close load template dialog
  const handleLoadDialogClose = () => {
    setOpenLoadDialog(false);
  };

  // Load template
  const handleLoadTemplate = (template: CostEstimationTemplate) => {
    setEstimationItems(template.items);
    handleLoadDialogClose();
    
    setSnackbarMessage('Template loaded successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Clear estimation
  const handleClearEstimation = () => {
    if (estimationItems.length === 0) return;
    
    setEstimationItems([]);
    setSnackbarMessage('Estimation cleared');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cost Estimation
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Item Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={inventoryItems}
              getOptionLabel={(option) => option.product_name}
              value={selectedItem}
              onChange={(_event, newValue) => setSelectedItem(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Inventory Item"
                  variant="outlined"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={itemQuantity}
              onChange={(e) => setItemQuantity(Number(e.target.value))}
              InputProps={{
                inputProps: { min: 1 },
                endAdornment: selectedItem ? (
                  <InputAdornment position="end">{selectedItem.unit}</InputAdornment>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Unit Price"
              fullWidth
              value={selectedItem ? formatCurrency(selectedItem.unitPrice) : ''}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              disabled={!selectedItem}
              fullWidth
            >
              Add Item
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Estimation Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>Item</TableCell>
              <TableCell sx={{ color: 'white' }}>Description</TableCell>
              <TableCell sx={{ color: 'white' }} align="right">Unit Price</TableCell>
              <TableCell sx={{ color: 'white' }} align="right">Quantity</TableCell>
              <TableCell sx={{ color: 'white' }} align="right">Unit</TableCell>
              <TableCell sx={{ color: 'white' }} align="right">Total</TableCell>
              <TableCell sx={{ color: 'white' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estimationItems.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                    InputProps={{
                      inputProps: { min: 1, style: { textAlign: 'right' } },
                    }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell align="right">{item.unit}</TableCell>
                <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                <TableCell align="center">
                  <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {estimationItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No items added to the estimation yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Total and Actions */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveDialogOpen}
              >
                Save Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={handleLoadDialogOpen}
              >
                Load Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearEstimation}
              >
                Clear
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Total Cost
            </Typography>
            <Typography variant="h4">
              {formatCurrency(totalCost)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Save Template Dialog */}
      <Dialog open={openSaveDialog} onClose={handleSaveDialogClose}>
        <DialogTitle>Save Estimation Template</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Save this estimation as a template for future use.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            variant="outlined"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveDialogClose}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Load Template Dialog */}
      <Dialog open={openLoadDialog} onClose={handleLoadDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Load Estimation Template</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a template to load:
          </DialogContentText>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {template.description || 'No description'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Items: {template.items.length} | Total: {formatCurrency(template.totalCost)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleLoadTemplate(template)}>
                      Load
                    </Button>
                    <IconButton size="small">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {templates.length === 0 && (
              <Grid item xs={12}>
                <Typography align="center">No saved templates</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoadDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CostEstimation; 