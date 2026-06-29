import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { Party, Product } from "@shared/schema";

const salesItemSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const salesFormSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  partyId: z.number().min(1, "Party is required"),
  date: z.string().min(1, "Date is required"),
  items: z.array(salesItemSchema).min(1, "At least one item is required"),
});

type SalesFormData = z.infer<typeof salesFormSchema>;

interface SalesFormProps {
  parties: Party[];
  products: Product[];
  onSubmit: (data: {
    order: Omit<SalesFormData, "items">;
    items: SalesFormData["items"];
  }) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export default function SalesForm({
  parties,
  products,
  onSubmit,
  isLoading,
  onCancel,
}: SalesFormProps) {
  const form = useForm<SalesFormData>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      orderNumber: `SO-${new Date().getFullYear()}-${String(Date.now()).slice(
        -6
      )}`,
      partyId: 0,
      date: new Date().toISOString().split("T")[0],
      items: [{ productId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = (data: SalesFormData) => {
    const { items, ...order } = data;
    onSubmit({ order, items });
  };

  const addItem = () => {
    append({ productId: 0, quantity: 1 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        data-testid="sales-form"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="orderNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SO-2024-001"
                    {...field}
                    data-testid="input-order-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="partyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Party</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-party">
                      <SelectValue placeholder="Select a party" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.name}
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    data-testid="input-order-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                data-testid="button-add-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-40 overflow-y-auto">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                data-testid={`order-item-${index}`}
              >
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
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
                          <SelectTrigger
                            data-testid={`select-product-${index}`}
                          >
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
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
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (pieces)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          min="1"
                          placeholder="e.g., 100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                          data-testid={`input-quantity-${index}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={fields.length === 1}
                  data-testid={`button-remove-item-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            data-testid="button-cancel-sales"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
            data-testid="button-save-sales"
          >
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
