import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
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

const CATEGORIES = [
  'Electrical',
  'Mechanical',
  'HVAC',
  'Sanitary',
  'Trading Goods',
  'Finished Goods',
  'Fabricated',
  'AUX Electronics',
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
  const [selectedItems, setSelectedItems] = useState<Array<{
    item: any;
    quantity: number;
  }>>([]);
  const [drawerWidth, setDrawerWidth] = useState(800);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousemove', handleMouseMove, true);
  }, [handleMouseUp, handleMouseMove]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
  }, [handleMouseMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (drawerRef.current) {
      let newWidth = e.clientX;
      setDrawerWidth(Math.max(300, Math.min(newWidth, window.innerWidth * 0.9)));
    }
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleOpen = (bom?: any) => {
    if (bom) {
      setEditingBOM(bom);
      setTitle(bom.title);
      setDescription(bom.description || '');
      setCategory(bom.category || '');
      setAuthor(bom.author || '');
      setSelectedItems(bom.items.map((item: any) => ({
        item: inventoryItems.find(i => i.id === item.inventoryitemid),
        quantity: item.quantity,
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
      items: selectedItems.map(({ item, quantity }) => ({
        id: crypto.randomUUID(),
        inventoryitemid: item.id,
        quantity,
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
        anchor="left"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: drawerWidth, position: 'relative' },
          ref: drawerRef
        }}
      >
        <Box
          sx={{
            width: '10px',
            cursor: 'ew-resize',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
          }}
          onMouseDown={handleMouseDown}
        />
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
                              getOptionLabel={(option) => option.name}
                              value={item.item}
                              onChange={(_event, newValue) => {
                                const updatedItems = [...selectedItems];
                                updatedItems[index] = { ...item, item: newValue };
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
                                value={item.item?.unit || ''}
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
                                value={item.item?.category || ''}
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
                              value={item.item?.supplier || ''}
                              label="Supplier"
                              fullWidth
                              margin="dense"
                              InputProps={{ readOnly: true, style: { fontSize: '1.0rem' } }}
                              InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 300 }}>
                            <TextField
                              value={item.item?.description || ''}
                              label="Description"
                              fullWidth
                              margin="dense"
                              InputProps={{ readOnly: true, style: { fontSize: '1.0rem' } }}
                              InputLabelProps={{ style: { fontSize: '1.0rem' } }}
                    />
                  </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <TextField
                              value={item.item?.updated_by || ''}
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
                                setSelectedItems(selectedItems.filter((_, i) => i !== index));
                              }}
                              size="small"
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
                  startIcon={<AddIcon />}
                  onClick={() => setSelectedItems([...selectedItems, {
                    item: null,
                    quantity: 1,
                  }])}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Drawer>
    </Box>
  );
};

export default BillOfMaterial;