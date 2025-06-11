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
      const { data, error } = await supabase
        .from('inventory')
        .select('*, unit, category, supplier');  // Select all columns to avoid any naming mismatches
      if (error) {
        showNotification({ type: 'error', message: 'Failed to fetch inventory' });
      } else if (data) {
        // Explicitly map data to InventoryItem to ensure correct field mapping
        const mappedData: InventoryItem[] = data.map((item: any) => ({
          id: item.id,
          product_id: item.product_id || '',
          product_name: item.product_name || '',
          description: item.description || '',
          unit_price: item.unit_price,
          quantity: item.quantity,
          unit: item.unit || null,
          category: item.category || null,
          supplier: item.supplier || null,
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
    if (!user || !user.id) {
      showNotification({ type: 'error', message: 'You must be logged in to add inventory items' });
      return;
    }

    try {
      // Get the current session to get the auth user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.error('Session error:', sessionError);
        showNotification({ type: 'error', message: 'Authentication error. Please try logging in again.' });
        return;
      }

      const item = {
        product_id: newItem.product_id,
        product_name: newItem.product_name,
        description: newItem.description,
        unit_price: newItem.unit_price,
        quantity: newItem.quantity,
        unit: newItem.unit || null,
        category: newItem.category || null,
        supplier: newItem.supplier || null,
        status: determineInventoryStatus(newItem.quantity),
        last_updated: new Date().toISOString(),
        updated_by: session.user.id,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('inventory')
        .insert([item])
        .select('*, unit, category, supplier')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        showNotification({ 
          type: 'error', 
          message: `Failed to add item: ${error.message || 'Unknown error'}` 
        });
        return;
      }

      if (!data) {
        showNotification({ 
          type: 'error', 
          message: 'Failed to add item: No data returned from insert' 
        });
        return;
      }

      // Map the inserted data to ensure all fields are properly set
      const insertedItem: InventoryItem = {
        ...data,
        unit: data.unit || null,
        category: data.category || null,
        supplier: data.supplier || null,
      };

      // Update local state
      setItems(prev => [...prev, insertedItem]);
      showNotification({
        type: 'success',
        message: `Added ${data.product_name} to inventory`
      });
    } catch (err) {
      console.error('Error adding item:', err);
      showNotification({ 
        type: 'error', 
        message: `Failed to add item: ${err instanceof Error ? err.message : 'Unknown error'}` 
      });
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

    // Handle optional fields for updates
    if (updates.unit !== undefined) {
      updatesToApply.unit = updates.unit || null;
    }
    if (updates.category !== undefined) {
      updatesToApply.category = updates.category || null;
    }
    if (updates.supplier !== undefined) {
      updatesToApply.supplier = updates.supplier || null;
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('inventory')
      .update(updatesToApply)
      .eq('id', id)
      .select('*, unit, category, supplier');

    if (error) {
      showNotification({ type: 'error', message: `Failed to update item: ${error.message}` });
      return;
    }

    if (data && data.length > 0) {
      // Map the updated data to ensure all fields are properly set
      const updatedItem: InventoryItem = {
        ...data[0],
        unit: data[0].unit || null,
        category: data[0].category || null,
        supplier: data[0].supplier || null,
      };

      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return updatedItem;
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
