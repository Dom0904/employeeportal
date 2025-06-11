import { InventoryItem } from './Inventory';

interface CostEstimationItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  unit_price: number;
  quantity: number;
  total: number;
}

export interface BOMItem {
  id: string;
  bom_id: string;
  inventoryitemid: string;
  quantity: number;
  unit: string;
  category: string;
  supplier: string;
  description: string;
}

export interface BOM {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  category: string;
  author: string;
  items: BOMItem[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BOMItemWithDetails extends BOMItem {
  details: InventoryItem;
}

export interface BOMWithDetails extends Omit<BOM, 'items'> {
  items: BOMItemWithDetails[];
}

export interface BOMContextType {
  boms: BOM[];
  addBOM: (bom: Omit<BOM, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> & { items: BOMItem[] }) => Promise<void>;
  updateBOM: (id: string, updates: Partial<BOM> & { items?: BOMItem[] }) => Promise<void>;
  deleteBOM: (id: string) => Promise<void>;
  getBOMById: (id: string) => BOM | undefined;
  exportBOMToPDF: (id: string) => Promise<void>;
  exportBOMToCSV: (id: string) => Promise<void>;
  importBOMToCostEstimation: (id: string) => Promise<{ importedBOM: BOM; importedItems: CostEstimationItem[] } | null>;
}
