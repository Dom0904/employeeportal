import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { BOM, BOMContextType, BOMItem } from '../types/BOM';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useNotifications } from './NotificationContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../supabaseClient';
import { generateUUID } from '../utils/uuid';

// Initialize autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

  // Construct the public URL for the logo from Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/public-images//logo.png`;

  // Extracted fetchBOMs into a useCallback hook
  const fetchBOMs = useCallback(async () => {
    // Get all BOMs
    const { data: bomData, error: bomError } = await supabase.from('boms').select('*');
    if (bomError) {
      showNotification({ type: 'error', message: 'Failed to fetch BOMs' });
      return;
    }
    // Get all BOM items
    const { data: itemData, error: itemError } = await supabase.from('bom_items').select('id, bom_id, inventoryitemid, quantity, unit, category, supplier, description');
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
              unit: inventoryItem?.unit ?? item.unit ?? null,
              category: inventoryItem?.category ?? item.category ?? null,
              supplier: inventoryItem?.supplier ?? item.supplier ?? null,
              description: inventoryItem?.description ?? item.description ?? null,
              inventoryDetails: inventoryItem || null,
          }
      })
    }));
    console.log('Fetched BOMs with items and inventory details:', bomsWithItems);
    setBoms(bomsWithItems);
  }, [showNotification, inventoryItems]);

  // Fetch BOMs when the component mounts or inventoryItems change
  useEffect(() => {
    if (inventoryItems.length > 0) { // Only fetch BOMs if inventoryItems are loaded
      fetchBOMs();
    }
  }, [fetchBOMs, inventoryItems]); // Add inventoryItems to dependency array

  const addBOM = useCallback(async (
    newBom: Omit<BOM, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> & { items: BOMItem[] }
  ) => {
    if (!user) {
      throw new Error('User must be logged in to create BOM');
    }

    try {
      const bomId = generateUUID();
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
      const { data, error } = await supabase.from('boms').insert([bomToInsert]).select();
      console.log('Supabase insert BOM response:', data, error);
      if (error) {
        console.error('Supabase error creating BOM:', error);
        showNotification({ type: 'error', message: 'Failed to create BOM' });
        return;
      }
      if (data && data.length > 0) {
        const insertedBom = data[0];
        // Insert BOM items
        const itemsToInsert = newBom.items.map(item => ({
            id: generateUUID(),
            bom_id: insertedBom.id,
            inventoryitemid: item.inventoryitemid,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            supplier: item.supplier,
            description: item.description,
        }));
        const { error: itemError } = await supabase.from('bom_items').insert(itemsToInsert);
        console.log('Supabase insert BOM items response:', itemError);
        if (itemError) {
          console.error('Supabase error creating BOM items:', itemError);
          await supabase.from('boms').delete().eq('id', insertedBom.id);
          showNotification({ type: 'error', message: 'Failed to create BOM items' });
          return;
        }
        setBoms(prev => [...prev, { ...bom, items: itemsToInsert }]);
        showNotification({
          type: 'success',
          message: 'Bill of Materials created successfully'
        });
      }
    } catch (err: any) {
      console.error('Unhandled error in addBOM:', err);
      showNotification({ type: 'error', message: `Failed to create BOM: ${err.message}` });
    }
  }, [user, showNotification]);

  const updateBOM = useCallback(async (
    id: string,
    updates: Partial<BOM> & { items?: BOMItem[] }
  ) => {
    console.log('updateBOM received updates:', updates);
    if (!user) {
      throw new Error('User must be logged in to update BOM');
    }

    try {
      const { items: itemsToUpdate, ...bomUpdates } = updates; // Separate items from BOM updates

      const updatesToApply: any = {
        ...bomUpdates,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };
      // Map projectId to project_id if present in updates
      if (updatesToApply.projectId !== undefined) {
        updatesToApply.project_id = updatesToApply.projectId;
        delete updatesToApply.projectId; // Remove camelCase version if present
      }
      console.log('updatesToApply before Supabase update:', updatesToApply);
      console.log('Attempting to update BOM with ID:', id);
      const { data: bomUpdateData, error: bomError } = await supabase.from('boms').update(updatesToApply).eq('id', id).select();
      console.log('Supabase update BOM response:', bomUpdateData, bomError);
      if (bomError) {
        console.error('Supabase error updating BOM:', bomError);
        showNotification({ type: 'error', message: 'Failed to update BOM' });
        return;
      }

      if (!bomUpdateData || bomUpdateData.length === 0) {
        console.warn('Supabase update BOM: No BOM found with ID', id, 'or update failed silently.');
        showNotification({ type: 'error', message: 'Failed to update BOM (not found or silent failure)' });
        return;
      }

      // Update BOM items
      if (itemsToUpdate) {
        // Delete existing items
        const { error: deleteError } = await supabase.from('bom_items').delete().eq('bom_id', id);
        console.log('Supabase delete BOM items response:', deleteError);
        if (deleteError) {
          console.error('Supabase error deleting BOM items during update:', deleteError);
          showNotification({ type: 'error', message: 'Failed to update BOM items' });
          return;
        }
        // Insert new items
        const itemsToInsert = itemsToUpdate.map(item => ({
            id: generateUUID(),
            bom_id: id,
            inventoryitemid: item.inventoryitemid,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            supplier: item.supplier,
            description: item.description,
        }));
        const { error: insertError } = await supabase.from('bom_items').insert(itemsToInsert);
        console.log('Supabase insert BOM items during update response:', insertError);
        if (insertError) {
          console.error('Supabase error inserting BOM items during update:', insertError);
          showNotification({ type: 'error', message: 'Failed to update BOM items' });
          return;
        }
      }
      // Refresh BOMs
      await fetchBOMs();
      showNotification({
        type: 'success',
        message: 'Bill of Materials updated successfully'
      });
    } catch (err: any) {
      console.error('Unhandled error in updateBOM:', err);
      showNotification({ type: 'error', message: `Failed to update BOM: ${err.message}` });
    }
  }, [user, showNotification, fetchBOMs]);

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
      showNotification({ type: 'error', message: 'BOM not found for export' });
      return;
    }

    const doc = new jsPDF();

    // Date formatting helper function
    const formatDate = (dateString: string | undefined | null) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    };
    
    // Add EdgeTech Logo from Supabase Storage
    const imgData = logoUrl; // Use the dynamically constructed logo URL
    const logoHeight = 20; // Define logo height for calculation
    const logoWidth = 50;
    const logoX = 14;
    const logoY = 10;
    doc.addImage(imgData, 'PNG', logoX, logoY, logoWidth, logoHeight);

    let currentY = logoY + logoHeight + 15; // Start text below logo with more padding

    doc.setFontSize(18);
    doc.text(`Bill of Materials: ${bom.title}`, 14, currentY);
    currentY += 10;
    doc.setFontSize(12);
    doc.text(`Project ID: ${bom.projectId}`, 14, currentY);
    currentY += 7;
    doc.text(`Description: ${bom.description}`, 14, currentY);
    currentY += 7;
    doc.text(`Category: ${bom.category}`, 14, currentY);
    currentY += 7;
    doc.text(`Author: ${bom.author}`, 14, currentY);
    currentY += 7;
    doc.text(`Created At: ${formatDate(bom.createdAt)}`, 14, currentY);
    currentY += 7;
    doc.text(`Updated At: ${formatDate(bom.updatedAt)}`, 14, currentY);
    currentY += 15;

    // Check if items array is empty
    if (bom.items.length === 0) {
      doc.setFontSize(12);
      doc.text('No items in this BOM.', 14, currentY);
      currentY += 10; // Adjust Y position for next content
    } else {
      // Prepare table data for items
      const tableColumn = ["Item ID", "Description", "Category", "Supplier", "Quantity", "Unit"];
      const tableRows: any[] = [];

      bom.items.forEach(item => {
        const itemData = [
          item.inventoryitemid,
          item.description || 'N/A',
          item.category || 'N/A',
          item.supplier || 'N/A',
          item.quantity,
          item.unit || 'N/A',
        ];
        tableRows.push(itemData);
      });

      // Add the table to the PDF
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [75, 75, 75], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 10, left: 14, right: 14 },
        didDrawPage: function (data: any) {
          // Footer
          var str = 'Page ' + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(str, data.settings.margin.left, (doc as any).internal.pageSize.height - 10);
        },
      });
      currentY = (doc as any).autoTable.previous.finalY + 10; // Update currentY after table
    }

    // Save the PDF
    doc.save(`BOM_${bom.title}.pdf`);
    showNotification({ type: 'success', message: 'BOM exported to PDF successfully' });

  }, [getBOMById, showNotification]);

  const exportBOMToCSV = useCallback(async (id: string) => {
    const bom = getBOMById(id);
    if (!bom) {
      throw new Error('BOM not found');
    }

    console.log('BOM items for CSV export:', bom.items);

    const headers = ["Item No.", "Item", "Description", "Unit", "Category", "Quantity"];
    const rows = bom.items.map((item, index) => [
      index + 1,
      item.inventoryDetails?.product_name || 'N/A',
      item.description || 'N/A',
      item.unit || 'N/A',
      item.category || 'N/A',
      item.quantity,
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(e => `\"${e}\"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `BOM_${bom.title}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showNotification({ type: 'success', message: 'BOM exported to CSV successfully' });
  }, [getBOMById, showNotification]);

  const importBOMToCostEstimation = useCallback(async (id: string) => {
    const bom = getBOMById(id);
    if (!bom) {
      showNotification({ type: 'error', message: 'BOM not found for import.' });
      return null; // Return null if BOM is not found
    }

    const importedItems = bom.items.map(item => ({
      id: generateUUID(),
      itemId: item.inventoryitemid,
      name: item.inventoryDetails?.product_name || item.description || 'Unknown Item',
      description: item.description || 'N/A',
      unit_price: item.inventoryDetails?.unit_price || 0,
      quantity: item.quantity,
      unit: item.unit || 'N/A',
      category: item.category || 'N/A',
      supplier: item.supplier || 'N/A',
      total: (item.inventoryDetails?.unit_price || 0) * item.quantity,
    }));

    const importedBOM = {
      id: bom.id,
      title: bom.title,
      description: bom.description,
      projectId: bom.projectId,
      category: bom.category,
      author: bom.author,
      createdAt: bom.createdAt,
      updatedAt: bom.updatedAt,
      createdBy: bom.createdBy,
      updatedBy: bom.updatedBy,
      items: bom.items, // This will be the original BOMItem[] type
    };

    showNotification({ type: 'success', message: `BOM '${bom.title}' imported to Cost Estimation.` });
    return { importedBOM, importedItems };
  }, [getBOMById, showNotification]);

  const contextValue = useMemo(() => ({
    boms,
    addBOM,
    updateBOM,
    deleteBOM,
    getBOMById,
    exportBOMToPDF,
    exportBOMToCSV,
    importBOMToCostEstimation,
    fetchBOMs,
  }), [boms, addBOM, updateBOM, deleteBOM, getBOMById, exportBOMToPDF, exportBOMToCSV, importBOMToCostEstimation, fetchBOMs]);

  return (
    <BOMContext.Provider value={contextValue}>
      {children}
    </BOMContext.Provider>
  );
};
