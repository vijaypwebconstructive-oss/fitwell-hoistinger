import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import ResponsiveDataTable from "@/components/ui/responsive-data-table";
import type { ProductionWithProduct } from "@shared/schema";

interface ProductionTableProps {
  production: ProductionWithProduct[];
  onEdit: (record: ProductionWithProduct) => void;
  onDelete: (record: ProductionWithProduct) => void;
}

export default function ProductionTable({ production, onEdit, onDelete }: ProductionTableProps) {
  const columns = [
    {
      key: 'date' as keyof ProductionWithProduct,
      label: 'Date',
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: 'product' as keyof ProductionWithProduct,
      label: 'Product',
      className: 'font-medium',
      render: (value: any) => value.name,
    },
    {
      key: 'product' as keyof ProductionWithProduct,
      label: 'Weight (g)',
      render: (value: any, record: ProductionWithProduct) => {
        const weightGrams = (record as any).weightGramsOverride || value.weightGrams;
        return `${parseFloat(weightGrams).toFixed(2)} g`;
      },
    },
    {
      key: 'quantityKg' as keyof ProductionWithProduct,
      label: 'Quantity (KG)',
      render: (value: string) => `${parseFloat(value).toFixed(3)} kg`,
    },
    {
      key: 'pieces' as keyof ProductionWithProduct,
      label: 'Pieces',
      className: 'font-bold',
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'product' as keyof ProductionWithProduct,
      label: 'Cost Per Piece',
      className: 'font-semibold text-green-700',
      render: (value: any, record: ProductionWithProduct) => {
        const weightGrams = (record as any).weightGramsOverride || value.weightGrams;
        const pricePerKg = (record as any).rawMaterialPricePerKgOverride || value.rawMaterialPricePerKg;
        return `₹${((parseFloat(weightGrams) / 1000) * parseFloat(pricePerKg)).toFixed(2)}`;
      },
    },
    {
      key: 'product' as keyof ProductionWithProduct,
      label: 'Material Type',
      render: (value: any) => <Badge variant="outline">{value.rawMaterialType}</Badge>,
    },
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: (record: ProductionWithProduct) => onEdit(record),
      variant: 'ghost' as const,
      testId: (record: ProductionWithProduct) => `button-edit-production-${record.id}`,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (record: ProductionWithProduct) => onDelete(record),
      variant: 'ghost' as const,
      testId: (record: ProductionWithProduct) => `button-delete-production-${record.id}`,
    },
  ];

  return (
    <ResponsiveDataTable
      data={production}
      columns={columns}
      actions={actions}
      emptyMessage="No production records found. Add your first production record to track manufacturing output."
      testId="production-table"
      getRowTestId={(record) => `production-row-${record.id}`}
    />
  );
}