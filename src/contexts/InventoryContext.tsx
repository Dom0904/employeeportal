import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { InventoryItem, InventoryContextType } from '../types/Inventory';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { supabase } from '../supabaseClient';

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
      const { data, error } = await supabase.from('inventory').select('*');
      if (error) {
        showNotification({ type: 'error', message: 'Failed to fetch inventory' });
      } else if (data) {
        setItems(data);
      }
    };
    fetchItems();
    // Optionally: subscribe to changes via Supabase Realtime
  }, [showNotification]);
  const { user, verifyPassword } = useAuth();

  const addItem = useCallback(async (
    newItem: Omit<InventoryItem, 'id' | 'lastUpdated' | 'updatedBy'>
  ) => {
    if (!user) {
      throw new Error('User must be logged in to add inventory items');
    }

    const item: InventoryItem = {
      ...newItem,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
      updatedBy: user.id
    };

    // Insert into Supabase
    const { data, error } = await supabase.from('inventory').insert([item]);
    if (error) {
      showNotification({ type: 'error', message: `Failed to add item: ${error.message}` });
      return;
    }
    setItems(prev => [...prev, item]);
    showNotification({
      type: 'success',
      message: `Added ${item.productName} to inventory`
    });
  }, [user, showNotification]);

  const editItem = useCallback(async (
    id: string,
    updates: Partial<InventoryItem>
  ) => {
    if (!user) {
      throw new Error('User must be logged in to edit inventory items');
    }

    // Update in Supabase
    const { error } = await supabase.from('inventory').update({
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.id
    }).eq('id', id);
    if (error) {
      showNotification({ type: 'error', message: `Failed to update item: ${error.message}` });
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          lastUpdated: new Date().toISOString(),
          updatedBy: user.id
        };
      }
      return item;
    }));
    showNotification({
      type: 'success',
      message: `Updated inventory item`
    });
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
      message: `Deleted ${itemToDelete.productName} from inventory`
    });
  }, [user, items, verifyPassword, showNotification]);

  const getItemById = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getItemByProductId = useCallback((productId: string) => {
    return items.find(item => item.productId === productId);
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
