import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import ResponsiveDataTable from "@/components/ui/responsive-data-table";
import type { InventoryItem } from "@shared/schema";

interface InventoryTableProps {
  inventory: InventoryItem[];
}

export default function InventoryTable({ inventory }: InventoryTableProps) {
  const getStockStatus = (currentStock: number) => {
    if (currentStock < 20) return { status: "critical", color: "bg-red-100 text-red-800", icon: TrendingDown };
    if (currentStock < 50) return { status: "low", color: "bg-amber-100 text-amber-800", icon: Minus };
    return { status: "good", color: "bg-green-100 text-green-800", icon: TrendingUp };
  };

  const columns = [
    {
      key: 'name' as keyof InventoryItem,
      label: 'Product',
      className: 'font-medium',
    },
    {
      key: 'currentStock' as keyof InventoryItem,
      label: 'Current Stock',
      className: 'font-bold',
      render: (value: number) => `${value.toLocaleString()} pieces`,
    },
    {
      key: 'totalProduced' as keyof InventoryItem,
      label: 'Total Produced',
      render: (value: number) => `${value.toLocaleString()} pieces`,
    },
    {
      key: 'totalSold' as keyof InventoryItem,
      label: 'Total Sold',
      render: (value: number) => `${value.toLocaleString()} pieces`,
    },
    // {
    //   key: 'adjustments' as keyof InventoryItem,
    //   label: 'Adjustments',
    //   render: (value: number) => {
    //     const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';
    //     const prefix = value > 0 ? '+' : '';
    //     return <span className={color}>{prefix}{value.toLocaleString()}</span>;
    //   },
    // },
    {
      key: 'currentStock' as keyof InventoryItem,
      label: 'Status',
      render: (value: number) => {
        const stockInfo = getStockStatus(value);
        const StockIcon = stockInfo.icon;
        return (
          <div className="flex items-center space-x-1">
            <Badge className={stockInfo.color}>
              <StockIcon className="w-3 h-3 mr-1" />
              {stockInfo.status}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'rawMaterialType' as keyof InventoryItem,
      label: 'Material',
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
  ];

  return (
    <ResponsiveDataTable
      data={inventory}
      columns={columns}
      emptyMessage="No inventory data available. Add products and production records to see inventory levels."
      testId="inventory-table"
      getRowTestId={(item) => `inventory-row-${item.id}`}
    />
  );
}