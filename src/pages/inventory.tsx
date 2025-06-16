import dynamic from 'next/dynamic';

const InventoryPage = dynamic(() => import('./inventory-impl'), { ssr: false });
export default InventoryPage;

// If your implementation is in this file, move it to inventory-impl.tsx and re-export here.