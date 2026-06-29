import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface PlanItem {
  productId: number;
  productName: string;
  quantityPieces: number;
  weightGrams: number;
  rawMaterialType: string;
  rawMaterialPricePerKg: number;
}

export default function Planning() {
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const addToPlan = () => {
    if (!selectedProductId || !quantity) return;

    const product = products?.find(
      (p: any) => p.id === parseInt(selectedProductId)
    );
    if (!product) return;

    const newItem: PlanItem = {
      productId: product.id,
      productName: product.name,
      quantityPieces: parseInt(quantity),
      weightGrams: parseFloat(product.weightGrams),
      rawMaterialType: product.rawMaterialType,
      rawMaterialPricePerKg: parseFloat(product.rawMaterialPricePerKg),
    };

    setPlanItems([...planItems, newItem]);
    setSelectedProductId("");
    setQuantity("");
  };

  const removeFromPlan = (index: number) => {
    setPlanItems(planItems.filter((_, i) => i !== index));
  };
  console.log(planItems);
  // Calculate material requirements
  const materialRequirements = planItems.reduce((acc, item) => {
    const totalWeightKg = (item.quantityPieces * item.weightGrams) / 1000;
    const material = item.rawMaterialType;

    if (!acc[material]) {
      acc[material] = {
        totalKg: 0,
        pricePerKg: item.rawMaterialPricePerKg,
        totalCost: 0,
      };
    }

    acc[material].totalKg += totalWeightKg;
    acc[material].totalCost = acc[material].totalKg * acc[material].pricePerKg;

    return acc;
  }, {} as Record<string, { totalKg: number; pricePerKg: number; totalCost: number }>);

  const totalCost = Object.values(materialRequirements).reduce(
    (sum, mat) => sum + mat.totalCost,
    0
  );

  return (
    <div className="space-y-6" data-testid="planning-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="planning-title">
                Production Planning
              </CardTitle>
              <p
                className="text-muted-foreground text-sm mt-1 hidden sm:block"
                data-testid="planning-description"
              >
                Plan production runs and calculate raw material requirements
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Items to Plan */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="product-select">Product</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger data-testid="select-product-planning">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity-input">Quantity (pieces)</Label>
              <Input
                id="quantity-input"
                type="tel"
                placeholder="e.g., 500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                data-testid="input-quantity-planning"
              />
            </div>
            <Button
              onClick={addToPlan}
              disabled={!selectedProductId || !quantity}
              data-testid="button-add-to-plan"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Plan
            </Button>
          </div>

          {/* Plan Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Production Plan Items
            </h3>
            {planItems.length === 0 ? (
              <div
                className="text-center text-muted-foreground py-8"
                data-testid="no-plan-items"
              >
                No items in the production plan. Add products above to get
                started.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {planItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                    data-testid={`plan-item-${index}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <span
                          className="font-medium"
                          data-testid={`plan-product-${index}`}
                        >
                          {item.productName}
                        </span>
                        <Badge
                          variant="secondary"
                          data-testid={`plan-quantity-${index}`}
                        >
                          {item.quantityPieces} pieces
                        </Badge>
                        <span
                          className="text-sm text-muted-foreground"
                          data-testid={`plan-weight-${index}`}
                        >
                          {(
                            (item.quantityPieces * item.weightGrams) /
                            1000
                          ).toFixed(2)}{" "}
                          kg
                        </span>
                        <Badge
                          variant="outline"
                          data-testid={`plan-material-${index}`}
                        >
                          {item.rawMaterialType}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromPlan(index)}
                      data-testid={`button-remove-plan-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Material Requirements */}
          {Object.keys(materialRequirements).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Material Requirements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(materialRequirements).map(
                  ([material, data]) => (
                    <Card
                      key={material}
                      data-testid={`material-requirement-${material}`}
                    >
                      <CardContent className="p-4">
                        <h4
                          className="font-medium mb-2"
                          data-testid={`material-name-${material}`}
                        >
                          {material}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Required:</span>
                            <span
                              className="font-medium"
                              data-testid={`material-quantity-${material}`}
                            >
                              {data.totalKg.toFixed(2)} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Price/kg:</span>
                            <span data-testid={`material-price-${material}`}>
                              ₹{data.pricePerKg}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Total Cost:</span>
                            <span
                              className="font-bold"
                              data-testid={`material-cost-${material}`}
                            >
                              ₹{data.totalCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    Total Material Cost:
                  </span>
                  <span
                    className="text-xl font-bold text-primary"
                    data-testid="total-material-cost"
                  >
                    ₹{totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
