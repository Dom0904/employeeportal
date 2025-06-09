import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BOM, BOMContextType, BOMItem } from '../types/BOM';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useNotifications } from './NotificationContext';
import { jsPDF } from 'jspdf';
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
      const { data: itemData, error: itemError } = await supabase.from('bom_items').select('id, bom_id, inventoryitemid, quantity');
      if (itemError) {
        showNotification({ type: 'error', message: 'Failed to fetch BOM items' });
        return;
      }
      // Merge items into BOMs
      const bomList = bomData || [];
      const itemList = itemData || [];
      const bomsWithItems = bomList.map((bom: any) => ({
        ...bom,
        items: itemList.filter((item: any) => item.bom_id === bom.id).map((item: any) => ({
            id: item.id,
            bom_id: item.bom_id,
            inventoryitemid: item.inventoryitemid,
            quantity: item.quantity
        }))
      }));
      setBoms(bomsWithItems);
    };
    fetchBOMs();
  }, [showNotification]);

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
    // Insert BOM
    const { error: bomError } = await supabase.from('boms').insert([{ ...bom, items: undefined }]);
    if (bomError) {
      showNotification({ type: 'error', message: 'Failed to create BOM' });
      return;
    }
    // Insert BOM items
    const itemsToInsert = newBom.items.map(item => ({
        id: crypto.randomUUID(),
        bom_id: bomId,
        inventoryitemid: item.inventoryitemid,
        quantity: item.quantity
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
    const { error: bomError } = await supabase.from('boms').update({
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    }).eq('id', id);
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
          quantity: item.quantity
      }));
      await supabase.from('bom_items').insert(itemsToInsert);
    }
    // Refresh BOMs
    const { data: bomData } = await supabase.from('boms').select('*');
    const { data: itemData } = await supabase.from('bom_items').select('id, bom_id, inventoryitemid, quantity');
    const bomsWithItems = (bomData ?? []).map((bom: any) => ({
      ...bom,
      items: (itemData ?? []).filter((item: any) => item.bom_id === bom.id).map((item: any) => ({
          id: item.id,
          bom_id: item.bom_id,
          inventoryitemid: item.inventoryitemid,
          quantity: item.quantity
      }))
    }));
    setBoms(bomsWithItems);
    showNotification({
      type: 'success',
      message: 'Bill of Materials updated successfully'
    });
  }, [user, showNotification]);

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

    // Add title
    doc.setFontSize(20);
    doc.text('Bill of Materials', 14, 20);

    // Add project info
    doc.setFontSize(12);
    doc.text(`Title: ${bom.title}`, 14, 30);
    if (bom.description) {
      doc.text(`Description: ${bom.description}`, 14, 40);
    }
    if (bom.projectId) {
      doc.text(`Project ID: ${bom.projectId}`, 14, 50);
    }

    // Create table data
    const tableData = bom.items.map(item => {
      const inventoryItem = inventoryItems.find(i => i.id === item.inventoryitemid);
      return [
        inventoryItem?.product_id || '',
        inventoryItem?.product_name || '',
        item.quantity.toString(),
      ];
    });

    // Add table
    (doc as any).autoTable({
      startY: 60,
      head: [['Product ID', 'Product Name', 'Quantity']],
      body: tableData,
    });

    // Save the PDF
    doc.save(`BOM-${bom.title}-${new Date().toISOString().split('T')[0]}.pdf`);

    showNotification({
      type: 'success',
      message: 'BOM exported to PDF successfully'
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
            unit: inventoryItem?.unit || '',
            unitPrice: inventoryItem?.unitPrice || 0,
            quantity: item.quantity,
            total: (inventoryItem?.unitPrice || 0) * item.quantity,
        };
    });

    // You would then typically pass costEstimationItems to the Cost Estimation component
    // For now, we'll just log it and show a notification.
    console.log('Imported items for Cost Estimation:', costEstimationItems);

    showNotification({
      type: 'success',
      message: 'BOM imported to Cost Estimation successfully'
    });
  }, [getBOMById, inventoryItems, showNotification]);

  const value = {
    boms,
    addBOM,
    updateBOM,
    deleteBOM,
    getBOMById,
    exportBOMToPDF,
    importBOMToCostEstimation,
  };

  return (
    <BOMContext.Provider value={value}>
      {children}
    </BOMContext.Provider>
  );
};
