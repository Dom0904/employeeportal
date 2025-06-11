import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { BOM, BOMContextType, BOMItem } from '../types/BOM';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useNotifications } from './NotificationContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../supabaseClient';

const BOMContext = createContext<BOMContextType | undefined>(undefined);

export const useBOM = () => {
  const context = useContext(BOMContext);
  if (!context) {
    throw new Error('useBOM must be used within a BOMProvider');
  }
  return context;
};

export const BOMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [boms, setBoms] = useState<BOM[]>([]);
  const { user } = useAuth();
  const { items: inventoryItems } = useInventory();
  const { showNotification } = useNotifications();

  // Fetch BOMs and items from Supabase on mount
  useEffect(() => {
    const fetchBOMs = async () => {
      // Get all BOMs
      const { data: bomData, error: bomError } = await supabase.from('boms').select('*');
      if (bomError) {
        showNotification({ type: 'error', message: 'Failed to fetch BOMs' });
        return;
      }
      // Get all BOM items
      const { data: itemData, error: itemError } = await supabase.from('bom_items').select('id, bom_id, inventoryitemid, quantity, unit, category, supplier, description, author');
      if (itemError) {
        showNotification({ type: 'error', message: 'Failed to fetch BOM items' });
        return;
      }
      // Merge items into BOMs
      const bomList = bomData || [];
      const itemList = itemData || [];
      const bomsWithItems = bomList.map((bom: any) => ({
        ...bom,
        projectId: bom.project_id,
        items: itemList.filter((item: any) => item.bom_id === bom.id).map((item: any) => {
            const inventoryItem = inventoryItems.find(invItem => invItem.id === item.inventoryitemid);
            return {
                id: item.id,
                bom_id: item.bom_id,
                inventoryitemid: item.inventoryitemid,
                quantity: item.quantity,
                unit: inventoryItem?.unit || item.unit, // Prefer inventory item's unit, fallback to bom_item's if available
                category: inventoryItem?.category || item.category, // Prefer inventory item's category, fallback to bom_item's if available
                supplier: inventoryItem?.supplier || item.supplier, // Prefer inventory item's supplier, fallback to bom_item's if available
                description: inventoryItem?.description || item.description, // Prefer inventory item's description, fallback to bom_item's if available
                author: item.author // Author is specific to BOM item
            }
        })
      }));
      setBoms(bomsWithItems);
    };
    fetchBOMs();
  }, [showNotification, inventoryItems]);

  const addBOM = useCallback(async (
    newBom: Omit<BOM, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> & { items: BOMItem[] }
  ) => {
    if (!user) {
      throw new Error('User must be logged in to create BOM');
    }

    const bomId = crypto.randomUUID();
    const bom: BOM = {
      ...newBom,
      id: bomId,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      items: []
    };
    // Prepare object for Supabase insert, mapping projectId to project_id
    const bomToInsert = {
      id: bom.id,
      title: bom.title,
      description: bom.description,
      project_id: bom.projectId,
      category: bom.category,
      author: bom.author,
      created_at: bom.createdAt,
      created_by: bom.createdBy,
      updated_at: bom.updatedAt,
      updated_by: bom.updatedBy,
    };
    // Insert BOM
    const { error: bomError } = await supabase.from('boms').insert([bomToInsert]);
    if (bomError) {
      showNotification({ type: 'error', message: 'Failed to create BOM' });
      return;
    }
    // Insert BOM items
    const itemsToInsert = newBom.items.map(item => ({
        id: crypto.randomUUID(),
        bom_id: bomId,
        inventoryitemid: item.inventoryitemid,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        supplier: item.supplier,
        description: item.description,
        author: item.author
    }));
    const { error: itemError } = await supabase.from('bom_items').insert(itemsToInsert);
    if (itemError) {
      showNotification({ type: 'error', message: 'Failed to create BOM items' });
      return;
    }
    setBoms(prev => [...prev, { ...bom, items: itemsToInsert }]);
    showNotification({
      type: 'success',
      message: 'Bill of Materials created successfully'
    });
  }, [user, showNotification]);

  const updateBOM = useCallback(async (
    id: string,
    updates: Partial<BOM> & { items?: BOMItem[] }
  ) => {
    if (!user) {
      throw new Error('User must be logged in to update BOM');
    }
    // Update BOM
    const updatesToApply: any = {
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };
    // Map projectId to project_id if present in updates
    if (updates.projectId !== undefined) {
      updatesToApply.project_id = updates.projectId;
      delete updatesToApply.projectId; // Remove camelCase version if present
    }
    const { error: bomError } = await supabase.from('boms').update(updatesToApply).eq('id', id);
    if (bomError) {
      showNotification({ type: 'error', message: 'Failed to update BOM' });
      return;
    }
    // Update BOM items
    if (updates.items) {
      // Delete existing items
      await supabase.from('bom_items').delete().eq('bom_id', id);
      // Insert new items
      const itemsToInsert = updates.items.map(item => ({
          id: crypto.randomUUID(),
          bom_id: id,
          inventoryitemid: item.inventoryitemid,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          supplier: item.supplier,
          description: item.description,
          author: item.author
      }));
      await supabase.from('bom_items').insert(itemsToInsert);
    }
    // Refresh BOMs
    const { data: bomData } = await supabase.from('boms').select('*');
    const { data: itemData } = await supabase.from('bom_items').select('id, bom_id, inventoryitemid, quantity, unit, category, supplier, description, author');
    const bomsWithItems = (bomData ?? []).map((bom: any) => ({
      ...bom,
      items: (itemData ?? []).filter((item: any) => item.bom_id === bom.id).map((item: any) => {
          const inventoryItem = inventoryItems.find(invItem => invItem.id === item.inventoryitemid);
          return {
              id: item.id,
              bom_id: item.bom_id,
              inventoryitemid: item.inventoryitemid,
              quantity: item.quantity,
              unit: inventoryItem?.unit || item.unit,
              category: inventoryItem?.category || item.category,
              supplier: inventoryItem?.supplier || item.supplier,
              description: inventoryItem?.description || item.description,
              author: item.author
          }
      })
    }));
    setBoms(bomsWithItems);
    showNotification({
      type: 'success',
      message: 'Bill of Materials updated successfully'
    });
  }, [user, showNotification, inventoryItems]);

  const deleteBOM = useCallback(async (id: string) => {
    // Delete BOM (cascade deletes items)
    const { error } = await supabase.from('boms').delete().eq('id', id);
    if (error) {
      showNotification({ type: 'error', message: 'Failed to delete BOM' });
      return;
    }
    setBoms(prev => prev.filter(bom => bom.id !== id));
    showNotification({
      type: 'success',
      message: 'Bill of Materials deleted successfully'
    });
  }, [showNotification]);

  const getBOMById = useCallback((id: string) => {
    return boms.find(bom => bom.id === id);
  }, [boms]); // Optionally: fetch directly from Supabase if not found

  const exportBOMToPDF = useCallback(async (id: string) => {
    const bom = getBOMById(id);
    if (!bom) {
      throw new Error('BOM not found');
    }

    const doc = new jsPDF();
    console.log('jsPDF instance created. autoTable:', (doc as any).autoTable);

    // Add title and project ID
    doc.setFontSize(16);
    doc.text(`Title: ${bom.title}`, 14, 20);
    if (bom.projectId) {
      doc.text(`Project ID: ${bom.projectId}`, 14, 30);
    }

    // Create table data
    const tableData = bom.items.map((item, index) => {
      const inventoryItem = inventoryItems.find(i => i.id === item.inventoryitemid);
      return [
        (index + 1).toString(), // Item No.
        inventoryItem?.product_name || 'N/A', // Item
        item.description || 'N/A', // Description
        item.unit || 'N/A', // Unit
        item.category || 'N/A', // Category
        item.supplier || 'N/A', // Supplier
        inventoryItem?.unit_price ? `$${inventoryItem.unit_price.toFixed(2)}` : 'N/A', // Unit Price
        item.quantity.toString(), // Quantity
      ];
    });

    // Add table
    (doc as any).autoTable({
      startY: bom.projectId ? 40 : 30, // Adjust startY based on whether Project ID is present
      head: [['Item No.', 'Item', 'Description', 'Unit', 'Category', 'Supplier', 'Unit Price', 'Quantity']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { // Apply styles to specific columns
        0: { cellWidth: 15 }, // Item No.
        1: { cellWidth: 'auto' }, // Item
        2: { cellWidth: 'auto' }, // Description
        3: { cellWidth: 15 }, // Unit
        4: { cellWidth: 'auto' }, // Category
        5: { cellWidth: 'auto' }, // Supplier
        6: { cellWidth: 20 }, // Unit Price
        7: { cellWidth: 20 }, // Quantity
      }
    });

    // Save the PDF
    doc.save(`BOM-${bom.title.replace(/ /g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);

    showNotification({
      type: 'success',
      message: 'BOM exported to PDF successfully'
    });
  }, [getBOMById, inventoryItems, showNotification]);

  const exportBOMToCSV = useCallback(async (id: string) => {
    const bom = getBOMById(id);
    if (!bom) {
      throw new Error('BOM not found');
    }

    let csvContent = 'Item No.,Item,Description,Unit,Category,Supplier,Unit Price,Quantity\n'; // CSV Headers

    bom.items.forEach((item, index) => {
      const inventoryItem = inventoryItems.find(i => i.id === item.inventoryitemid);
      const itemNo = (index + 1).toString();
      const itemName = inventoryItem?.product_name || 'N/A';
      const description = item.description || 'N/A';
      const unit = item.unit || 'N/A';
      const category = item.category || 'N/A';
      const supplier = item.supplier || 'N/A';
      const unitPrice = inventoryItem?.unit_price ? `$${inventoryItem.unit_price.toFixed(2)}` : 'N/A';
      const quantity = item.quantity.toString();
      csvContent += `"${itemNo}","${itemName}","${description}","${unit}","${category}","${supplier}","${unitPrice}","${quantity}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `BOM-${bom.title.replace(/ /g, '_')}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification({
      type: 'success',
      message: 'BOM exported to CSV successfully'
    });
  }, [getBOMById, inventoryItems, showNotification]);

  const importBOMToCostEstimation = useCallback(async (id: string) => {
    // This is a placeholder - you'll need to implement the actual import logic
    // based on your cost estimation feature requirements
    const bomToImport = getBOMById(id);
    if (!bomToImport) return;

    // Map BOM items to CostEstimation items structure if needed for the other component
    const costEstimationItems = bomToImport.items.map(item => {
        const inventoryItem = inventoryItems.find(i => i.id === item.inventoryitemid);
        return {
            id: `ce-item-${item.id}`,
            itemId: item.inventoryitemid,
            name: inventoryItem?.product_name || 'Unknown Item',
            description: inventoryItem?.description || '',
            unitPrice: inventoryItem?.unit_price || 0,
            quantity: item.quantity,
            total: (inventoryItem?.unit_price || 0) * item.quantity,
        };
    });

    // Example: Navigate to cost estimation page with imported data
    // navigate('/cost-estimation', { state: { importedBOM: bomToImport, importedItems: costEstimationItems } });

    showNotification({
      type: 'info',
      message: 'BOM imported to Cost Estimation (feature needs full implementation)'
    });
  }, [getBOMById, inventoryItems, showNotification]);

  const contextValue = useMemo(
    () => ({
    boms,
    addBOM,
    updateBOM,
    deleteBOM,
    getBOMById,
    exportBOMToPDF,
      exportBOMToCSV,
    importBOMToCostEstimation,
    }),
    [boms, addBOM, updateBOM, deleteBOM, getBOMById, exportBOMToPDF, exportBOMToCSV, importBOMToCostEstimation]
  );

  return (
    <BOMContext.Provider value={contextValue}>
      {children}
    </BOMContext.Provider>
  );
};
