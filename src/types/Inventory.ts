export type InventoryStatus = 'in-stock' | 'out-of-stock' | 'restock' | 'low-stock';

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  unit: string;
  unit_price: number;
  quantity: number;
  status: InventoryStatus;
  last_updated: string;
  updated_by: string;
}

export interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'>) => Promise<void>;
  editItem: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'last_updated' | 'updated_by'>>) => Promise<void>;
  deleteItem: (id: string, password: string) => Promise<void>;
  getItemById: (id: string) => InventoryItem | undefined;
  getItemByProductId: (productId: string) => InventoryItem | undefined;
}
