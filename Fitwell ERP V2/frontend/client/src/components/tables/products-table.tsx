import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import ResponsiveDataTable from "@/components/ui/responsive-data-table";
import type { Product } from "@shared/schema";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export default function ProductsTable({ products, onEdit, onDelete, isDeleting }: ProductsTableProps) {
  const columns = [
    {
      key: 'name' as keyof Product,
      label: 'Product Name',
      className: 'font-medium',
    },
    {
      key: 'weightGrams' as keyof Product,
      label: 'Weight (g)',
      render: (value: string) => `${value}g`,
    },
    {
      key: 'rawMaterialType' as keyof Product,
      label: 'Raw Material',
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: 'rawMaterialPricePerKg' as keyof Product,
      label: 'Price per KG',
      render: (value: string) => `₹${parseFloat(value).toFixed(2)}`,
    },
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: (product: Product) => onEdit(product),
      variant: 'ghost' as const,
      testId: (product: Product) => `button-edit-product-${product.id}`,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (product: Product) => onDelete(product.id),
      disabled: isDeleting,
      variant: 'ghost' as const,
      testId: (product: Product) => `button-delete-product-${product.id}`,
    },
  ];

  return (
    <ResponsiveDataTable
      data={products}
      columns={columns}
      actions={actions}
      emptyMessage="No products found. Add your first product to get started."
      testId="products-table"
      getRowTestId={(product) => `product-row-${product.id}`}
    />
  );
}
