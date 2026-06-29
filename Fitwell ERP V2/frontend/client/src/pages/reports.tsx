import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isWithinInterval } from "date-fns";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data: production } = useQuery({
    queryKey: ["/api/production"],
    queryFn: api.getProduction,
  });

  const { data: salesOrders } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSalesOrders,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  // Filter data by date range
  const filteredProduction = production?.filter((record: any) => {
    const recordDate = parseISO(record.date);
    return isWithinInterval(recordDate, {
      start: parseISO(startDate),
      end: parseISO(endDate)
    });
  }) || [];

  const filteredSales = salesOrders?.filter((order: any) => {
    const orderDate = parseISO(order.date);
    return isWithinInterval(orderDate, {
      start: parseISO(startDate),
      end: parseISO(endDate)
    });
  }) || [];

  // Calculate product performance
  const productPerformance = products?.map((product: any) => {
    const productionRecords = filteredProduction.filter((p: any) => p.productId === product.id);
    const totalProduced = productionRecords.reduce((sum: any, p: any) => sum + p.pieces, 0);
    const totalMaterialUsed = productionRecords.reduce((sum: any, p: any) => 
      sum + parseFloat(p.quantityKg), 0
    );

    // Calculate sold quantities (this would need sales order items data in a real implementation)
    const totalSold = 0; // Placeholder

    return {
      product,
      totalProduced,
      totalSold,
      totalMaterialUsed,
      materialType: product.rawMaterialType
    };
  }) || [];

  // Material consumption summary
  const materialConsumption = productPerformance.reduce((acc: any, item: any) => {
    const material = item.materialType;
    if (!acc[material]) {
      acc[material] = { totalCost: 0, totalKg: 0 };
    }
    // totalMaterialUsed is already in kg, so add it directly
    acc[material].totalKg += item.totalMaterialUsed;
    // Calculate cost by multiplying kg by price per kg
    acc[material].totalCost += item.totalMaterialUsed * parseFloat(item.product.rawMaterialPricePerKg);
    return acc;
  }, {} as Record<string, { totalCost: number; totalKg: number }>);

  const { toast } = useToast();

  // Calculate summary totals
  const totalProduction = filteredProduction.reduce((sum: any, p: any) => sum + p.pieces, 0);
  const totalSalesOrders = filteredSales.length;
  const totalMaterialUsed = (Object.values(materialConsumption) as { totalCost: number; totalKg: number }[])
    .reduce((sum: number, mat: { totalCost: number; totalKg: number }) => sum + mat.totalKg, 0);

  // Generate Excel Report
  const handleGenerateReport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Summary Sheet
      const summaryData = [
        ["Production Report Summary"],
        ["Report Period", `${format(parseISO(startDate), "dd/MM/yyyy")} - ${format(parseISO(endDate), "dd/MM/yyyy")}`],
        ["Generated On", format(new Date(), "dd/MM/yyyy HH:mm:ss")],
        [],
        ["Metric", "Value"],
        ["Total Production (pieces)", totalProduction],
        ["Sales Orders", totalSalesOrders],
        ["Material Used (kg)", totalMaterialUsed.toFixed(2)],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // 2. Product Performance Sheet
      const productPerformanceData = [
        ["Product", "Produced (pieces)", "Sold (pieces)", "Material Used (kg)", "Raw Material Type"],
        ...productPerformance.map((item: any) => [
          item.product.name,
          item.totalProduced,
          item.totalSold,
          item.totalMaterialUsed.toFixed(2),
          item.materialType || "N/A",
        ]),
      ];
      const productPerformanceSheet = XLSX.utils.aoa_to_sheet(productPerformanceData);
      XLSX.utils.book_append_sheet(workbook, productPerformanceSheet, "Product Performance");

      // 3. Material Consumption Sheet
      const materialConsumptionData = [
        ["Material Type", "Total Consumed (kg)", "Total Cost (₹)"],
        ...Object.entries(materialConsumption).map(([material, data]) => [
          material,
          (data as any).totalKg.toFixed(2),
          (data as any).totalCost.toFixed(2),
        ]),
      ];
      const materialConsumptionSheet = XLSX.utils.aoa_to_sheet(materialConsumptionData);
      XLSX.utils.book_append_sheet(workbook, materialConsumptionSheet, "Material Consumption");

      // 4. Production Records Sheet
      const productionData = [
        ["Date", "Product", "Quantity (kg)", "Pieces"],
        ...filteredProduction.map((record: any) => [
          format(parseISO(record.date), "dd/MM/yyyy"),
          record.product?.name || "N/A",
          parseFloat(record.quantityKg || "0").toFixed(3),
          record.pieces,
        ]),
      ];
      const productionSheet = XLSX.utils.aoa_to_sheet(productionData);
      XLSX.utils.book_append_sheet(workbook, productionSheet, "Production Records");

      // 5. Sales Orders Sheet
      const salesData = [
        ["Order Number", "Date", "Party", "Status", "Item Count"],
        ...filteredSales.map((order: any) => [
          order.orderNumber,
          format(parseISO(order.date), "dd/MM/yyyy"),
          order.party?.name || "N/A",
          order.status,
          order.itemCount,
        ]),
      ];
      const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales Orders");

      // Generate filename with date range
      const filename = `Production_Report_${format(parseISO(startDate), "yyyyMMdd")}_${format(parseISO(endDate), "yyyyMMdd")}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Report Generated",
        description: `Excel report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="reports-title">Production Reports</CardTitle>
              <p className="text-muted-foreground text-sm mt-1 hidden sm:block" data-testid="reports-description">
                Analyze production performance and material consumption
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full" 
                data-testid="button-generate-report"
                onClick={handleGenerateReport}
              >
                Generate Report
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card data-testid="summary-production">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Total Production</h3>
                <p className="text-3xl font-bold text-primary" data-testid="total-production-pieces">
                  {filteredProduction.reduce((sum: any, p: any) => sum + p.pieces, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">pieces manufactured</p>
              </CardContent>
            </Card>

            <Card data-testid="summary-orders">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Sales Orders</h3>
                <p className="text-3xl font-bold text-green-600" data-testid="total-sales-orders">
                  {filteredSales.length}
                </p>
                <p className="text-sm text-muted-foreground">orders created</p>
              </CardContent>
            </Card>

            <Card data-testid="summary-material-used">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Material Used</h3>
                <p className="text-3xl font-bold text-amber-600" data-testid="total-material-kg-value">
                  {(Object.values(materialConsumption) as { totalCost: number; totalKg: number }[])
                    .reduce((sum: number, mat: { totalCost: number; totalKg: number }) => sum + mat.totalKg, 0)
                    .toFixed(2)} kg
                </p>
                <p className="text-sm text-muted-foreground">total raw materials consumed</p>
              </CardContent>
            </Card>
          </div>

          {/* Product Performance Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Product Performance</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full border border-border rounded-lg" data-testid="table-product-performance">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Produced</th>
                    <th className="text-left p-4 font-medium">Sold</th>
                    <th className="text-left p-4 font-medium">Material Used</th>
                    <th className="text-left p-4 font-medium">Raw Material</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground" data-testid="no-performance-data">
                        No production data found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    productPerformance.map((item: any, index: any) => (
                      <tr key={item.product.id} className="border-t" data-testid={`performance-row-${index}`}>
                        <td className="p-4 font-medium" data-testid={`performance-product-${index}`}>
                          {item.product.name}
                        </td>
                        <td className="p-4" data-testid={`performance-produced-${index}`}>
                          {item.totalProduced.toLocaleString()} pieces
                        </td>
                        <td className="p-4" data-testid={`performance-sold-${index}`}>
                          {item.totalSold.toLocaleString()} pieces
                        </td>
                        <td className="p-4" data-testid={`performance-material-kg-${index}`}>
                          {item.totalMaterialUsed.toFixed(2)} kg
                        </td>
                        <td className="p-4" data-testid={`performance-material-type-${index}`}>
                          <Badge variant="outline">{item.materialType}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Material Consumption Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Material Consumption</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(materialConsumption).length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-8" data-testid="no-material-data">
                  No material consumption data for the selected date range.
                </div>
              ) : (
                Object.entries(materialConsumption).map(([material, data]) => (
                  <Card key={material} data-testid={`material-consumption-${material}`}>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2" data-testid={`material-consumption-name-${material}`}>
                        {material}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Consumed:</span>
                          <span className="font-medium" data-testid={`material-consumption-kg-${material}`}>
                            {(data as any).totalKg.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Cost:</span>
                          <span className="font-bold" data-testid={`material-consumption-cost-${material}`}>
                            ₹{(data as any).totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
