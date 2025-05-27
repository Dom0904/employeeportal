export type InventoryStatus = 'in-stock' | 'out-of-stock' | 'restock' | 'low-stock';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: InventoryStatus;
  lastUpdated: string;
  updatedBy: string;
}

export interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'updatedBy'>) => Promise<void>;
  editItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string, password: string) => Promise<void>;
  getItemById: (id: string) => InventoryItem | undefined;
  getItemByProductId: (productId: string) => InventoryItem | undefined;
}
