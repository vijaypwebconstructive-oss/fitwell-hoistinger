import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Package, Trash2, XCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ResponsiveDataTable from "@/components/ui/responsive-data-table";
import type { SalesOrderWithParty } from "@shared/schema";

interface SalesTableProps {
  salesOrders: SalesOrderWithParty[];
  onFulfill: (orderId: number, fulfillments: any) => void;
  isFulfilling: boolean;
  onDelete: (orderId: number) => void;
  onCancel: (orderId: number) => void;
  onPrint: (orderId: number) => void;
  isDeleting?: boolean;
  isCancelling?: boolean;
}

export default function SalesTable({ salesOrders, onFulfill, isFulfilling, onDelete, onCancel, onPrint, isDeleting, isCancelling }: SalesTableProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [fulfillmentData, setFulfillmentData] = useState<Record<number, number>>({});

  const { data: orderDetails } = useQuery({
    queryKey: ["/api/sales", selectedOrderId],
    queryFn: () => selectedOrderId ? api.getSalesOrder(selectedOrderId) : null,
    enabled: !!selectedOrderId,
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: api.getInventory,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "partial_invoice":
        return "bg-blue-100 text-blue-800";
      case "fully_invoiced":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const openDetailModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);
  };

  const openFulfillModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsFulfillModalOpen(true);
    // Initialize fulfillment data
    if (orderDetails?.items) {
      const initialData: Record<number, number> = {};
      orderDetails.items.forEach((item: any) => {
        initialData[item.id] = Math.max(0, item.quantity - item.fulfilled);
      });
      setFulfillmentData(initialData);
    }
  };

  const handleFulfill = () => {
    if (!selectedOrderId || !orderDetails) return;
    
    const fulfillments = Object.entries(fulfillmentData)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({
        itemId: parseInt(itemId),
        quantity
      }));

    onFulfill(selectedOrderId, fulfillments);
    setIsFulfillModalOpen(false);
    setSelectedOrderId(null);
  };

  const getCurrentStock = (productId: number): number => {
    if (!inventory) return 0;
    const inventoryItem = inventory.find((item: any) => item.id === productId);
    return inventoryItem?.currentStock || 0;
  };

  const columns = [
    {
      key: 'orderNumber' as keyof SalesOrderWithParty,
      label: 'Order Number',
      className: 'font-medium',
    },
    {
      key: 'party' as keyof SalesOrderWithParty,
      label: 'Party',
      render: (value: any) => value.name,
    },
    {
      key: 'date' as keyof SalesOrderWithParty,
      label: 'Date',
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: 'itemCount' as keyof SalesOrderWithParty,
      label: 'Items',
      render: (value: number) => `${value} items`,
    },
    {
      key: 'status' as keyof SalesOrderWithParty,
      label: 'Status',
      render: (value: string) => (
        <Badge className={getStatusColor(value)}>
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  const getActions = (order: SalesOrderWithParty) => {
    const actions = [
      {
        label: 'Print',
        icon: <Printer className="w-4 h-4" />,
        onClick: () => onPrint(order.id),
        variant: 'ghost' as const,
        disabled: false,
        testId: () => `button-print-order-${order.id}`,
      },
      {
        label: 'View',
        icon: <Eye className="w-4 h-4" />,
        onClick: () => openDetailModal(order.id),
        variant: 'ghost' as const,
        disabled: false,
        testId: () => `button-view-order-${order.id}`,
      },
    ];

    // Add fulfill button for pending and partial orders
    if (order.status === "pending" || order.status === "partial_invoice") {
      actions.push({
        label: 'Fulfill',
        icon: <Package className="w-4 h-4" />,
        onClick: () => openFulfillModal(order.id),
        variant: 'ghost' as const,
        disabled: isFulfilling,
        testId: () => `button-fulfill-order-${order.id}`,
      });
    }

    // Add cancel button for non-cancelled orders
    if (order.status !== "cancelled") {
      actions.push({
        label: 'Cancel',
        icon: <XCircle className="w-4 h-4" />,
        onClick: () => onCancel(order.id),
        variant: 'ghost' as const,
        disabled: isCancelling || false,
        testId: () => `button-cancel-order-${order.id}`,
      });
    }

    // Add delete button
    actions.push({
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete(order.id),
      variant: 'ghost' as const,
      disabled: isDeleting || false,
      testId: () => `button-delete-order-${order.id}`,
    });

    return actions;
  };

  return (
    <>
      <ResponsiveDataTable
        data={salesOrders}
        columns={columns}
        actions={getActions}
        emptyMessage="No sales orders found. Create your first sales order to start tracking orders."
        testId="sales-table"
        getRowTestId={(order) => `sales-order-row-${order.id}`}
        getCardTestId={(order) => `sales-order-card-${order.id}`}
      />

      {/* Order Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl" data-testid="order-details-modal">
          <DialogHeader>
            <DialogTitle>Order Details - {orderDetails?.orderNumber}</DialogTitle>
          </DialogHeader>
          {orderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Party</Label>
                  <p className="font-medium" data-testid="modal-party-name">{orderDetails.party.name}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p data-testid="modal-order-date">{format(new Date(orderDetails.date), "PPP")}</p>
                </div>
              </div>
              <div>
                <Label>Items</Label>
                <div className="mt-2 space-y-2">
                  {orderDetails.items.map((item: any, index: any) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded" data-testid={`modal-item-${index}`}>
                      <span data-testid={`modal-item-product-${index}`}>{item.product.name}</span>
                      <span data-testid={`modal-item-quantity-${index}`}>
                        {item.fulfilled}/{item.quantity} pieces
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fulfill Order Modal */}
      <Dialog open={isFulfillModalOpen} onOpenChange={setIsFulfillModalOpen}>
        <DialogContent className="max-w-xl" data-testid="fulfill-order-modal">
          <DialogHeader>
            <DialogTitle>Fulfill Order - {orderDetails?.orderNumber}</DialogTitle>
          </DialogHeader>
          {orderDetails && (
            <div className="space-y-4">
              <div className="space-y-3">
                {orderDetails.items.map((item: any, index: any) => {
                  const remaining = item.quantity - item.fulfilled;
                  const currentStock = getCurrentStock(item.product.id);
                  return (
                    <div key={item.id} className="space-y-2" data-testid={`fulfill-item-${index}`}>
                      <div className="flex items-center justify-between">
                        <Label data-testid={`fulfill-item-label-${index}`}>
                          {item.product.name} (Remaining: {remaining} pieces)
                        </Label>
                        <span className="text-sm text-muted-foreground" data-testid={`current-stock-${index}`}>
                          Current Stock: <span className="font-semibold">{currentStock.toLocaleString()}</span> pieces
                        </span>
                      </div>
                      <Input
                        type=""
                        min="0"
                        max={remaining}
                        value={fulfillmentData[item.id] || 0}
                        onChange={(e) => setFulfillmentData(prev => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value) || 0
                        }))}
                        data-testid={`input-fulfill-quantity-${index}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsFulfillModalOpen(false)}
                  data-testid="button-cancel-fulfill"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFulfill}
                  disabled={isFulfilling}
                  data-testid="button-confirm-fulfill"
                >
                  {isFulfilling ? "Fulfilling..." : "Fulfill Order"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}