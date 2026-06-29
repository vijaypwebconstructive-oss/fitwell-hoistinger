import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import InventoryTable from "@/components/tables/inventory-table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const stockAdjustmentSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  quantity: z.number().int("Quantity must be a whole number"),
  reason: z.string().min(1, "Reason is required"),
  date: z.string().min(1, "Date is required"),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

export default function Inventory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: api.getInventory,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
    enabled: isDialogOpen,
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: api.createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/inventory"],
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/stock-adjustments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/metrics"],
      });

      form.reset();
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Stock adjustment created successfully",
      });
    },
  });

  const form = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: 0,
      quantity: undefined,
      reason: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleCreateAdjustment = (data: StockAdjustmentData) => {
    createAdjustmentMutation.mutate(data);
  };

  if (isLoading) {
    return <div data-testid="loading-inventory">Loading inventory...</div>;
  }

  return (
    <div data-testid="inventory-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="inventory-title">
                Inventory Control
              </CardTitle>
              <p
                className="text-muted-foreground text-sm mt-1 hidden sm:block"
                data-testid="inventory-description"
              >
                Real-time view of stock levels with production and sales
                tracking
              </p>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);

                if (!open) {
                  form.reset({
                    productId: 0,
                    quantity: undefined,
                    reason: "",
                    date: new Date().toISOString().split("T")[0],
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  data-testid="button-stock-adjustment"
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Stock Adjustment
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="stock-adjustment-dialog">
                <DialogHeader>
                  <DialogTitle>Stock Adjustment</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleCreateAdjustment)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-product">
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products?.map((product: any) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id.toString()}
                                >
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Quantity (+ for increase, - for decrease)
                          </FormLabel>
                          <FormControl>
                            {/* <Input
                              type="text"
                              placeholder="e.g., +50 or -25"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              data-testid="input-quantity"
                            /> */}
                            <Input
                              type="text"
                              placeholder="e.g., +50 or -25"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsed = parseInt(val);
                                field.onChange(isNaN(parsed) ? val : parsed);
                              }}
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Physical count correction, Damaged goods, etc."
                              {...field}
                              data-testid="textarea-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createAdjustmentMutation.isPending}
                        data-testid="button-save-adjustment"
                      >
                        {createAdjustmentMutation.isPending
                          ? "Saving..."
                          : "Save Adjustment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <InventoryTable inventory={inventory || []} />
        </CardContent>
      </Card>
    </div>
  );
}
