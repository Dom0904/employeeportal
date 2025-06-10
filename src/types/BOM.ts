import { InventoryItem } from './Inventory';

export interface BOMItem {
  id: string;
  inventoryitemid: string;
  quantity: number;
}

export interface BOM {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  items: BOMItem[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  category?: string;
  author?: string;
}

export interface BOMItemWithDetails extends BOMItem {
  details: InventoryItem;
}

export interface BOMWithDetails extends Omit<BOM, 'items'> {
  items: BOMItemWithDetails[];
}

export interface BOMContextType {
  boms: BOM[];
  addBOM: (bom: Omit<BOM, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Promise<void>;
  updateBOM: (id: string, updates: Partial<BOM>) => Promise<void>;
  deleteBOM: (id: string) => Promise<void>;
  getBOMById: (id: string) => BOM | undefined;
  exportBOMToPDF: (id: string) => Promise<void>;
  exportBOMToCSV: (id: string) => Promise<void>;
  importBOMToCostEstimation: (id: string) => Promise<void>;
}
