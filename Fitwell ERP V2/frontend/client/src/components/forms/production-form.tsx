import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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
import type { Product } from "@shared/schema";

const productionFormSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  quantityKg: z.string().min(1, "Quantity is required"),
  date: z.string().min(1, "Date is required"),
  // Product property overrides (optional - only for this production record)
  weightGramsOverride: z.string().optional(),
  rawMaterialTypeOverride: z.string().optional(),
  rawMaterialPricePerKgOverride: z.string().optional(),
});

type ProductionFormData = z.infer<typeof productionFormSchema>;

interface ProductionFormProps {
  products: Product[];
  onSubmit: (data: ProductionFormData) => void;
  isLoading: boolean;
  defaultValues?: Partial<ProductionFormData>;
  onCancel?: () => void;
}

export default function ProductionForm({
  products,
  onSubmit,
  isLoading,
  defaultValues,
  onCancel,
}: ProductionFormProps) {
  const form = useForm<ProductionFormData>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      productId: defaultValues?.productId || 0,
      quantityKg: defaultValues?.quantityKg || "",
      date: defaultValues?.date || new Date().toISOString().split("T")[0],
      weightGramsOverride: defaultValues?.weightGramsOverride || "",
      rawMaterialTypeOverride: defaultValues?.rawMaterialTypeOverride || "",
      rawMaterialPricePerKgOverride: defaultValues?.rawMaterialPricePerKgOverride || "",
    },
  });

  const selectedProductId = form.watch("productId");
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // When product is selected, pre-fill product fields with master values (if not already set in edit mode)
  useEffect(() => {
    if (selectedProduct) {
      const currentWeight = form.getValues("weightGramsOverride");
      const currentMaterialType = form.getValues("rawMaterialTypeOverride");
      const currentPrice = form.getValues("rawMaterialPricePerKgOverride");
      
      // Only pre-fill if fields are empty (not editing with existing overrides)
      if (!currentWeight && (!defaultValues || !defaultValues.weightGramsOverride)) {
        form.setValue("weightGramsOverride", selectedProduct.weightGrams || "");
      }
      if (!currentMaterialType && (!defaultValues || !defaultValues.rawMaterialTypeOverride)) {
        form.setValue("rawMaterialTypeOverride", selectedProduct.rawMaterialType || "");
      }
      if (!currentPrice && (!defaultValues || !defaultValues.rawMaterialPricePerKgOverride)) {
        form.setValue("rawMaterialPricePerKgOverride", selectedProduct.rawMaterialPricePerKg || "");
      }
    }
  }, [selectedProductId, selectedProduct, form, defaultValues]);

  const handleSubmit = (data: ProductionFormData) => {
    const submitData: any = {
      productId: data.productId,
      quantityKg: data.quantityKg,
      date: data.date,
    };

    // Only include overrides if they differ from product master values
    if (selectedProduct) {
      if (data.weightGramsOverride && data.weightGramsOverride.trim() !== "" && data.weightGramsOverride !== selectedProduct.weightGrams) {
        submitData.weightGramsOverride = data.weightGramsOverride;
      }
      if (data.rawMaterialTypeOverride && data.rawMaterialTypeOverride.trim() !== "" && data.rawMaterialTypeOverride !== selectedProduct.rawMaterialType) {
        submitData.rawMaterialTypeOverride = data.rawMaterialTypeOverride;
      }
      if (data.rawMaterialPricePerKgOverride && data.rawMaterialPricePerKgOverride.trim() !== "" && data.rawMaterialPricePerKgOverride !== selectedProduct.rawMaterialPricePerKg) {
        submitData.rawMaterialPricePerKgOverride = data.rawMaterialPricePerKgOverride;
      }
    }

    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 production-form overflow-y-scroll max-h-[440px] pr-[10px] pl-[10px]"
        data-testid="production-form"
      >
        {/* Date Field - At the Top */}
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
                  data-testid="input-production-date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Selection */}
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(parseInt(value));
                  // Reset overrides when changing product
                  form.setValue("weightGramsOverride", "");
                  form.setValue("rawMaterialTypeOverride", "");
                  form.setValue("rawMaterialPricePerKgOverride", "");
                }}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-production-product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Property Overrides - Editable fields that override product master for this record only */}
        {selectedProduct && (
          <>
            <div className="space-y-2 pt-2 ">
              <p className="text-sm text-muted-foreground font-medium">
                Product Properties (Editable - Changes apply only to this production record)
              </p>
            </div>

            <FormField
              control={form.control}
              name="weightGramsOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (grams) {selectedProduct && `(Master: ${selectedProduct.weightGrams})`}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={selectedProduct?.weightGrams || "e.g., 10"}
                      {...field}
                      data-testid="input-weight-override"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Pre-filled with master value. Edit to override for this production record only (Product Master unchanged)
                  </p>
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="rawMaterialTypeOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raw Material Type {selectedProduct && `(Master: ${selectedProduct.rawMaterialType})`}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={selectedProduct?.rawMaterialType || "e.g., Mild Steel"}
                      {...field}
                      data-testid="input-material-type-override"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Pre-filled with master value. Edit to override for this production record only (Product Master unchanged)
                  </p>
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="rawMaterialPricePerKgOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Cost (₹/kg) {selectedProduct && `(Master: ${selectedProduct.rawMaterialPricePerKg})`}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={selectedProduct?.rawMaterialPricePerKg || "e.g., 55"}
                      {...field}
                      data-testid="input-material-price-override"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Pre-filled with master value. Edit to override for this production record only (Product Master unchanged)
                  </p>
                </FormItem>
              )}
            />
          </>
        )}

        {/* Quantity Field */}
        <FormField
          control={form.control}
          name="quantityKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity (KG)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  step="0.001"
                  placeholder="e.g., 2.5"
                  {...field}
                  data-testid="input-production-quantity"
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
            data-testid="button-cancel-production"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
            data-testid="button-save-production"
          >
            {isLoading ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
