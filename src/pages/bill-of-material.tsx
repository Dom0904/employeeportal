import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Grid,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Calculate as CalculateIcon,
  Description as CSVIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useBOM } from '../contexts/BOMContext';
import { useInventory } from '../contexts/InventoryContext';
import { UserRole } from '../contexts/AuthContext';
import { BOMItem } from '../types/BOM';
import { InventoryItem } from '../types/Inventory';

interface SelectedBOMItem extends BOMItem {
  inventoryDetails?: InventoryItem;
}

const CATEGORIES = [
  'Raw Materials',
  'Components',
  'Finished Goods',
  'Electronics',
  'Mechanical',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Other'
];

const UNITS = [
  'pcs',
  'kg',
  'g',
  'lb',
  'oz',
  'm',
  'cm',
  'mm',
  'in',
  'ft',
  'yd',
  'm²',
  'ft²',
  'm³',
  'ft³',
  'L',
  'mL',
  'gal',
  'qt',
  'pt'
];

const BillOfMaterial = () => {
  const { user } = useAuth();
  const { boms, addBOM, updateBOM, deleteBOM, exportBOMToPDF, importBOMToCostEstimation, exportBOMToCSV } = useBOM();
  const { items: inventoryItems } = useInventory();
  const [open, setOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedBOMItem[]>([]);
  const [drawerWidth, setDrawerWidth] = useState(800);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleOpen = (bom?: any) => {
    if (bom) {
      setEditingBOM(bom);
      setTitle(bom.title);
      setDescription(bom.description || '');
      setCategory(bom.category || '');
      setAuthor(bom.author || '');
      setSelectedItems(bom.items.map((bomItem: BOMItem) => ({
        ...bomItem,
        inventoryDetails: inventoryItems.find(invItem => invItem.id === bomItem.inventoryitemid),
      })));
    } else {
      setEditingBOM(null);
      setTitle('');
      setDescription('');
      setCategory('');
      setAuthor('');
      setSelectedItems([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBOM(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setAuthor('');
    setSelectedItems([]);
  };

  const handleSave = async () => {
    const bomData = {
      title,
      description,
      projectId: editingBOM?.projectId,
      category,
      author,
      items: selectedItems.map((selectedBomItem) => ({
        id: selectedBomItem.id || crypto.randomUUID(),
        bom_id: selectedBomItem.bom_id || '',
        inventoryitemid: selectedBomItem.inventoryitemid,
        quantity: selectedBomItem.quantity,
        unit: selectedBomItem.unit,
        category: selectedBomItem.category,
        supplier: selectedBomItem.supplier,
        description: selectedBomItem.description,
        author: selectedBomItem.author,
      }))
    };

    try {
      if (editingBOM) {
        await updateBOM(editingBOM.id, bomData);
      } else {
        await addBOM(bomData);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving BOM:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBOM(id);
    } catch (error) {
      console.error('Error deleting BOM:', error);
    }
  };

  const handleExportPDF = async (id: string) => {
    try {
      await exportBOMToPDF(id);
    } catch (error) {
      console.error('Error exporting BOM to PDF:', error);
    }
  };

  const handleImportToCostEstimation = async (id: string) => {
    try {
      await importBOMToCostEstimation(id);
    } catch (error) {
      console.error('Error importing BOM to Cost Estimation:', error);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 && drawerRef.current) {
      e.preventDefault();
      const rect = drawerRef.current.getBoundingClientRect();
      if (rect.right < e.clientX || rect.bottom < e.clientY || rect.left > e.clientX || rect.top > e.clientY) {
        setOpen(false);
      }
    }
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bill of Materials
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            disabled={!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role)}
          >
            Create New BOM
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '1.0rem' }}>Title</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Description</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Category</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Author</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Project ID</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Items</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Created</TableCell>
              <TableCell sx={{ fontSize: '1.0rem' }}>Updated</TableCell>
              <TableCell align="right" sx={{ fontSize: '1.0rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boms.map((bom) => (
              <TableRow key={bom.id}>
                <TableCell sx={{ fontSize: '0.9rem' }}>{bom.title}</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{bom.description}</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{bom.category}</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{bom.author}</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{bom.projectId}</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{bom.items.length} items</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{new Date(bom.createdAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{new Date(bom.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.9rem' }}>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleOpen(bom)}
                      disabled={!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(bom.id)}
                      disabled={!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export to PDF">
                    <IconButton onClick={() => handleExportPDF(bom.id)}>
                      <PdfIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export to CSV">
                    <IconButton onClick={() => exportBOMToCSV(bom.id)}>
                      <CSVIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Import to Cost Estimation">
                    <IconButton onClick={() => handleImportToCostEstimation(bom.id)}>
                      <CalculateIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        open={open}
        onClose={handleClose}
        anchor="right"
        ref={drawerRef}
        onMouseDown={handleMouseDown}
        PaperProps={{ style: { width: drawerWidth } }}
      >
        <DialogTitle>
          {editingBOM ? 'Edit Bill of Materials' : 'Create New Bill of Materials'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Title *"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  inputProps={{ style: { fontSize: '1.1rem' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Description"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={2}
                  inputProps={{ style: { fontSize: '1.1rem' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Items
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 250 }}>Item</TableCell>
                        <TableCell sx={{ minWidth: 100 }}>Quantity</TableCell>
                        <TableCell sx={{ minWidth: 100 }}>Unit</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Category</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Supplier</TableCell>
                        <TableCell sx={{ minWidth: 300 }}>Description</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Author</TableCell>
                        <TableCell sx={{ minWidth: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ minWidth: 250 }}>
                            <Autocomplete
                              options={inventoryItems}
                              getOptionLabel={(option) => option.product_name || ''}
                              value={item.inventoryDetails || undefined}
                              onChange={(_event, newValue) => {
                                const updatedItems = [...selectedItems];
                                updatedItems[index] = {
                                  ...item,
                                  inventoryitemid: newValue?.id || '',
                                  inventoryDetails: newValue || undefined,
                                  unit: newValue?.unit || '',
                                  category: newValue?.category || '',
                                  supplier: newValue?.supplier || '',
                                  description: newValue?.description || '',
                                  author: newValue?.updated_by || '',
                                };
                                setSelectedItems(updatedItems);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Select Item"
                                  variant="outlined"
                                  fullWidth
                                  margin="dense"
                                  inputProps={{
                                    ...params.inputProps,
                                    style: { fontSize: '1.0rem' }
                                  }}
                                  InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const updatedItems = [...selectedItems];
                                updatedItems[index] = { ...item, quantity: Number(e.target.value) };
                                setSelectedItems(updatedItems);
                              }}
                              fullWidth
                              margin="dense"
                              inputProps={{ style: { fontSize: '1.0rem' } }}
                              InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <FormControl fullWidth margin="dense">
                              <InputLabel id={`unit-select-label-${index}`} sx={{ fontSize: '1.0rem' }}>Unit</InputLabel>
                              <Select
                                labelId={`unit-select-label-${index}`}
                                value={item.unit || ''}
                                label="Unit"
                                disabled
                                sx={{ fontSize: '1.0rem' }}
                                MenuProps={{
                                  MenuListProps: {
                                    sx: { fontSize: '1.0rem' }
                                  }
                                }}
                              >
                                {UNITS.map((unitOption) => (
                                  <MenuItem key={unitOption} value={unitOption} sx={{ fontSize: '1.0rem' }}>
                                    {unitOption}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <FormControl fullWidth margin="dense">
                              <InputLabel id={`category-select-label-${index}`} sx={{ fontSize: '1.0rem' }}>Category</InputLabel>
                              <Select
                                labelId={`category-select-label-${index}`}
                                value={item.category || ''}
                                label="Category"
                                disabled
                                sx={{ fontSize: '1.0rem' }}
                                MenuProps={{
                                  MenuListProps: {
                                    sx: { fontSize: '1.0rem' }
                                  }
                                }}
                              >
                                {CATEGORIES.map((catOption) => (
                                  <MenuItem key={catOption} value={catOption} sx={{ fontSize: '1.0rem' }}>
                                    {catOption}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <TextField
                              value={item.supplier || ''}
                              label="Supplier"
                              fullWidth
                              margin="dense"
                              InputProps={{ readOnly: true, style: { fontSize: '1.0rem' } }}
                              InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 300 }}>
                            <TextField
                              value={item.description || ''}
                              label="Description"
                              fullWidth
                              margin="dense"
                              InputProps={{ readOnly: true, style: { fontSize: '1.0rem' } }}
                              InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <TextField
                              value={item.author || ''}
                              label="Author"
                              fullWidth
                              margin="dense"
                              InputProps={{ readOnly: true, style: { fontSize: '1.0rem' } }}
                              InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 50 }}>
                            <IconButton
                              onClick={() => {
                                const updatedItems = selectedItems.filter((_, i) => i !== index);
                                setSelectedItems(updatedItems);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button
                  onClick={() => setSelectedItems([...selectedItems, {
                    id: crypto.randomUUID(),
                    bom_id: '',
                    inventoryitemid: '',
                    quantity: 1,
                    unit: '',
                    category: '',
                    supplier: '',
                    description: '',
                    author: '',
                    inventoryDetails: undefined,
                  }])}
                  startIcon={<AddIcon />}
                >
                  Add Item
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={CATEGORIES}
                  value={category}
                  onChange={(_event, newValue) => setCategory(newValue || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      label="Category"
                      variant="outlined"
                      fullWidth
                      inputProps={{
                        ...params.inputProps,
                        style: { fontSize: '1.1rem' }
                      }}
                      InputLabelProps={{ style: { fontSize: '1.1rem' } }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Author"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  inputProps={{ style: { fontSize: '1.1rem' } }}
                  InputLabelProps={{ style: { fontSize: '1.1rem' } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Drawer>
    </Box>
  );
};

export default BillOfMaterial; 