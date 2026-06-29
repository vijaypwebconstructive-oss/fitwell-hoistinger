import { useQuery, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KPICards from "@/components/kpi-cards";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useMemo } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: api.getDashboardMetrics,
  });

  console.log("dash", metrics);

  const { data: recentProduction } = useQuery({
    queryKey: ["/api/production"],
    queryFn: api.getProduction,
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: api.getInventory,
  });

  const { data: salesOrders } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSalesOrders,
  });
  console.log("sales", salesOrders);
  
  // Show all inventory items, not just low stock
  const allInventoryItems = inventory || [];
  const pendingOrders =
    salesOrders?.filter((order: any) => order.status === "pending") || [];
  const partialOrders =
    salesOrders?.filter((order: any) => order.status === "partial_invoice") || [];
  const recentProductionRecords = recentProduction?.slice(0, 3) || [];

  // Fetch detailed order data for pending and partial orders
  const pendingAndPartialOrderIds = useMemo(() => {
    return [
      ...(pendingOrders || []).map((o: any) => o.id),
      ...(partialOrders || []).map((o: any) => o.id),
    ];
  }, [pendingOrders, partialOrders]);

  const orderDetailsQueries = useQueries({
    queries: pendingAndPartialOrderIds.map((orderId: number) => ({
      queryKey: ["/api/sales", orderId],
      queryFn: () => api.getSalesOrder(orderId),
      enabled: !!orderId,
    })),
  });

  // Calculate material requirements for pending and partial orders - grouped by material type
  const materialRequirements = useMemo(() => {
    const requirements: Record<
      string,
      { 
        materialType: string;
        totalKg: number;
      }
    > = {};

    orderDetailsQueries.forEach((query) => {
      const order = query.data;
      console.log('order', order);
      if (!order || !order.items) return;

      order.items.forEach((item: any) => {
        if (!item.product) return;
        console.log('item', item);
        const unfulfilledQuantity = item.quantity - item.fulfilled;
        if (unfulfilledQuantity <= 0) return;

        const weightGrams = parseFloat(item.product.weightGrams || "0");
        const materialType = item.product.rawMaterialType;

        // Calculate weight in kg: (pieces * weightGrams) / 1000
        const weightKg = (unfulfilledQuantity * weightGrams) / 1000;

        // Group by material type - combine same material types from different products/orders
        if (!requirements[materialType]) {
          requirements[materialType] = {
            materialType: materialType,
            totalKg: 0,
          };
        }

        // Sum up requirements for the same material type
        requirements[materialType].totalKg += weightKg;
      });
    });

    return requirements;
  }, [orderDetailsQueries]);

  if (isLoading) {
    return <div data-testid="loading-dashboard">Loading dashboard...</div>;
  }

  if (error || !metrics) {
    return (
      <div className="p-8 text-center" data-testid="error-dashboard">
        <p className="text-destructive">
          Failed to load dashboard metrics. Please try again.
        </p>
      </div>
    );
  }
  console.log("materialRequirements", materialRequirements);

  return (
    <div data-testid="dashboard-page">
      <KPICards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Production Records */}
        <Card className="lg:col-span-2" data-testid="recent-production-card">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Orders Requirements</CardTitle>
             {/* <Button
                data-testid="button-add-production"
                className="flex-shrink-0"
              >
                <Link to="/sales">Add Orders</Link>
                
              </Button>*/} 
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-6">
              {/* <div className="overflow-x-auto">
                <table
                  className="w-full data-table"
                  data-testid="table-recent-production"
                >
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Product
                      </th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Quantity (KG)
                      </th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Pieces
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProductionRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-muted-foreground"
                          data-testid="no-production-records"
                        >
                          No production records found. Start by adding your first
                          production record.
                        </td>
                      </tr>
                    ) : (
                      recentProductionRecords.map((record: any) => (
                        <tr
                          key={record.id}
                          data-testid={`production-row-${record.id}`}
                        >
                          <td
                            className="py-3 text-sm"
                            data-testid={`production-date-${record.id}`}
                          >
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </td>
                          <td
                            className="py-3 text-sm font-medium"
                            data-testid={`production-product-${record.id}`}
                          >
                            {record.product?.name ?? "Unknown Product"}
                          </td>
                          <td
                            className="py-3 text-sm"
                            data-testid={`production-quantity-${record.id}`}
                          >
                            {record.quantityKg}
                          </td>
                          <td
                            className="py-3 text-sm"
                            data-testid={`production-pieces-${record.id}`}
                          >
                            {record.pieces}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div> */}

              {/* Material Requirements for Pending/Partial Orders */}
              {Object.keys(materialRequirements).length > 0 && (
                <div className=" ">
                  {/* <h4 className="font-medium mb-4 text-sm">
                    Material Requirements for Pending & Partial Orders
                  </h4> */}
                  <div className="overflow-x-auto">
                    <table
                      className="w-full data-table"
                      data-testid="table-material-requirements"
                    >
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            Material Type
                          </th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            Total Requirement (KG)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(materialRequirements).map(
                          (requirement, index) => (
                            <tr
                              key={`${requirement.materialType}-${index}`}
                              data-testid={`material-requirement-${requirement.materialType}`}
                            >
                              <td className="py-3 text-sm font-medium">
                                {requirement.materialType}
                              </td>
                              <td className="py-3 text-sm">
                                {requirement.totalKg.toFixed(3)} KG
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card data-testid="inventory-alerts-card">
          <CardHeader className="border-b border-border">
            <CardTitle>Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {allInventoryItems.length === 0 ? (
              <div
                className="text-center text-muted-foreground py-4"
                data-testid="no-inventory-alerts"
              >
                No inventory items found.
              </div>
            ) : (
              allInventoryItems.map((item: any) => {
                const isCritical = item.currentStock < 500;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border inventoy-dashboard"
                    data-testid={`inventory-alert-${item.id}`}
                  >
                    <div className="flex  flex-row-reverse justify-between w-full items-center gap-3">
                      {/* Red dot for critical, green dot for non-critical */}
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isCritical ? "bg-red-500" : "bg-green-500"
                        }`}
                        data-testid={`alert-dot-${item.id}`}
                      />
                      <div>
                        <p
                          className="font-medium text-sm"
                          data-testid={`alert-product-${item.id}`}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-xs text-muted-foreground"
                          data-testid={`alert-stock-${item.id}`}
                        >
                          {item.currentStock} pieces remaining
                        </p>
                      </div>
                    </div>
                    {/* <Badge
                      variant={isCritical ? "destructive" : "secondary"}
                      data-testid={`alert-severity-${item.id}`}
                    /> */}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Pending Sales Orders */}
        {/* <Card data-testid="pending-orders-card">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Pending Sales Orders</CardTitle>
              <Button data-testid="button-new-order" className="flex-shrink-0">
                New Order
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <div
                  className="text-center text-muted-foreground py-4"
                  data-testid="no-pending-orders"
                >
                  No pending orders. All orders are up to date.
                </div>
              ) : (
                pendingOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                    data-testid={`pending-order-${order.id}`}
                  >
                    <div>
                      <p
                        className="font-medium"
                        data-testid={`order-number-${order.id}`}
                      >
                        {order.orderNumber}
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid={`order-party-${order.id}`}
                      >
                        {order.party.name}
                      </p>
                      <p
                        className="text-xs text-muted-foreground"
                        data-testid={`order-date-${order.id}`}
                      >
                        {format(new Date(order.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        data-testid={`order-status-${order.id}`}
                      >
                        {order.status}
                      </Badge>
                      <p
                        className="text-sm font-medium mt-1"
                        data-testid={`order-items-${order.id}`}
                      >
                        {order.itemCount} items
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card> */}

        {/* Production Planning */}
        <Card data-testid="production-planning-card">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Production Planning</CardTitle>
              <Button
                data-testid="button-plan-production"
                className="flex-shrink-0"
              >
                <Link to="/planning">Plan Production</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div
                className="p-4 bg-muted rounded-lg"
                data-testid="material-requirements"
              >
                <h4 className="font-medium mb-2">Material Requirements</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Access the Planning module to calculate material
                    requirements for production runs.
                  </p>
                </div>
              </div>
              <div
                className="p-4 border border-border rounded-lg"
                data-testid="todays-plan"
              >
                <h4 className="font-medium mb-2">Today's Plan</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Set up production plans to track daily manufacturing goals.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
