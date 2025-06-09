import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { InventoryItem, InventoryContextType, InventoryStatus } from '../types/Inventory';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { supabase } from '../supabaseClient';

// Helper function to determine status based on quantity (assuming max stock of 100)
const determineInventoryStatus = (quantity: number): InventoryStatus => {
  if (quantity === 0) {
    return 'out-of-stock';
  } else if (quantity <= 10) {
    return 'restock';
  } else if (quantity <= 25) {
    return 'low-stock';
  } else {
    return 'in-stock';
  }
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const { showNotification } = useNotifications();
  // Fetch inventory from Supabase on mount
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase.from('inventory').select('id, product_id, product_name, description, unit, unit_price, quantity, status, last_updated, updated_by');
      if (error) {
        showNotification({ type: 'error', message: 'Failed to fetch inventory' });
      } else if (data) {
        // Explicitly map data to InventoryItem to ensure unit_price is correctly assigned
        const mappedData: InventoryItem[] = data.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          description: item.description,
          unit: item.unit,
          unit_price: item.unit_price || item.unitPrice, // Handle both potential casings during fetch
          quantity: item.quantity,
          status: item.status,
          last_updated: item.last_updated,
          updated_by: item.updated_by,
        }));
        setItems(mappedData);
      }
    };
    fetchItems();
    // Optionally: subscribe to changes via Supabase Realtime
  }, [showNotification]);
  const { user, verifyPassword } = useAuth();

  const addItem = useCallback(async (
    newItem: Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'>
  ) => {
    if (!user) {
      throw new Error('User must be logged in to add inventory items');
    }

    const item = {
      product_id: newItem.product_id,
      product_name: newItem.product_name,
      description: newItem.description,
      unit: newItem.unit,
      unit_price: newItem.unit_price,
      quantity: newItem.quantity,
      status: determineInventoryStatus(newItem.quantity),
      last_updated: new Date().toISOString(),
      updated_by: user.id,
    };

    // Insert into Supabase
    const { data, error } = await supabase.from('inventory').insert([item]).select();
    if (error) {
      showNotification({ type: 'error', message: `Failed to add item: ${error.message}` });
      return;
    }
    if (data && data.length > 0) {
      setItems(prev => [...prev, data[0]]);
      showNotification({
        type: 'success',
        message: `Added ${data[0].product_name} to inventory`
      });
    } else {
      showNotification({ type: 'error', message: 'Failed to add item: No data returned from insert' });
    }
  }, [user, showNotification]);

  const editItem = useCallback(async (
    id: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'>>
  ) => {
    if (!user) {
      throw new Error('User must be logged in to edit inventory items');
    }

    const updatesToApply: any = {
      ...updates,
      last_updated: new Date().toISOString(),
      updated_by: user.id,
    };

    // If quantity is being updated, recalculate status
    if (updates.quantity !== undefined) {
      updatesToApply.status = determineInventoryStatus(updates.quantity);
    }

    // Map unit_price if present in updates (no longer need to map from unitPrice)
    if (updates.unit_price !== undefined) { // Changed from updates.unitPrice
      updatesToApply.unit_price = updates.unit_price; // Changed from updates.unitPrice
    }

    // Update in Supabase
    const { data, error } = await supabase.from('inventory').update(updatesToApply).eq('id', id).select();
    if (error) {
      showNotification({ type: 'error', message: `Failed to update item: ${error.message}` });
      return;
    }
    if (data && data.length > 0) {
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return data[0];
        }
        return item;
      }));
      showNotification({
        type: 'success',
        message: 'Updated inventory item'
      });
    } else {
      showNotification({ type: 'error', message: 'Failed to update item: No data returned from update' });
    }
  }, [user, showNotification]);

  const deleteItem = useCallback(async (
    id: string,
    password: string
  ) => {
    if (!user) {
      throw new Error('User must be logged in to delete inventory items');
    }

    // Verify password before deletion
    const isValid = await verifyPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) {
      throw new Error('Item not found');
    }

    // Delete from Supabase
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      showNotification({ type: 'error', message: `Failed to delete item: ${error.message}` });
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
    showNotification({
      type: 'success',
      message: `Deleted ${itemToDelete.product_name} from inventory`
    });
  }, [user, items, verifyPassword, showNotification]);

  const getItemById = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getItemByProductId = useCallback((productId: string) => {
    return items.find(item => item.product_id === productId);
  }, [items]);

  const value = {
    items,
    addItem,
    editItem,
    deleteItem,
    getItemById,
    getItemByProductId
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
