import { Card, CardContent } from "@/components/ui/card";
import { Hammer, ShoppingCart, AlertTriangle, DollarSign, Package } from "lucide-react";

interface KPICardsProps {
  metrics: {
    todayProduction: number;
    yesterdayProduction: number;
    pendingOrders: number;
    partialOrders: number;
    urgentOrders: number;
    lowStockItems: number;
    monthlyExpense: number;
  };
}

export default function KPICards({ metrics }: KPICardsProps) {
  // Ensure partialOrders has a default value if undefined
  const partialOrders = metrics.partialOrders ?? 0;
  
  // Calculate production change percentage (comparing current week with previous week)
  const productionChange = metrics.yesterdayProduction > 0
    ? ((metrics.todayProduction - metrics.yesterdayProduction) / metrics.yesterdayProduction * 100).toFixed(1)
    : null;
  
  const productionChangeText = productionChange 
    ? `${parseFloat(productionChange) >= 0 ? '+' : ''}${productionChange}% from last week`
    : metrics.yesterdayProduction === 0 ? 'No data from last week' : '';
  
  const productionChangeType = productionChange && parseFloat(productionChange) >= 0 ? "positive" : "negative";

  // Urgent orders text
  const urgentOrdersText = metrics.urgentOrders > 0
    ? `${metrics.urgentOrders} urgent ${metrics.urgentOrders === 1 ? 'order' : 'orders'}`
    : 'All orders up to date';

  const kpiData = [
    {
      title: "Weekly Production",
      value: metrics.todayProduction.toLocaleString(),
      change: productionChangeText,
      changeType: productionChangeType,
      icon: Hammer,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      testId: "kpi-production"
    },
    {
      title: "Pending Orders",
      value: metrics.pendingOrders.toString(),
      change: urgentOrdersText,
      changeType: metrics.urgentOrders > 0 ? "warning" : "positive",
      icon: ShoppingCart,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      testId: "kpi-orders"
    },
    {
      title: "Partial Orders",
      value: partialOrders.toString(),
      change: partialOrders > 0 ? "Partially fulfilled" : "No partial orders",
      changeType: partialOrders > 0 ? "warning" : "positive",
      icon: Package,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      testId: "kpi-partial-orders"
    },
    {
      title: "Low Stock Items",
      value: metrics.lowStockItems.toString(),
      change: metrics.lowStockItems > 0 ? "Requires attention" : "Stock levels good",
      changeType: metrics.lowStockItems > 0 ? "negative" : "positive",
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-destructive",
      testId: "kpi-stock"
    }
    // {
    //   title: "Expense (Month)",
    //   value: `₹${(metrics.monthlyExpense / 100000).toFixed(1)}L`,
    //   change: "Material costs",
    //   changeType: "neutral",
    //   icon: DollarSign,
    //   iconBg: "bg-purple-100",
    //   iconColor: "text-purple-600",
    //   testId: "kpi-expense"
    // }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-cards">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.testId} data-testid={kpi.testId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid={`${kpi.testId}-title`}>
                    {kpi.title}
                  </p>
                  <p className="text-3xl font-bold" data-testid={`${kpi.testId}-value`}>
                    {kpi.value}
                  </p>
                  <p 
                    className={`text-sm ${
                      kpi.changeType === "positive" 
                        ? "text-green-600" 
                        : kpi.changeType === "warning"
                        ? "text-amber-600"
                        : kpi.changeType === "neutral"
                        ? "text-muted-foreground"
                        : "text-destructive"
                    }`}
                    data-testid={`${kpi.testId}-change`}
                  >
                    {kpi.changeType === "positive" ? "↗ " : kpi.changeType === "warning" ? "→ " : kpi.changeType === "neutral" ? "→ " : "↘ "}
                    {kpi.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${kpi.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
