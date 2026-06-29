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

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  weightGrams: z.string().min(1, "Weight is required"),
  rawMaterialType: z.string().min(1, "Raw material type is required"),
  rawMaterialPricePerKg: z.string().min(1, "Material price is required"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isLoading: boolean;
  initialData?: Partial<ProductFormData>;
  onCancel?: () => void;
}

export default function ProductForm({
  onSubmit,
  isLoading,
  initialData,
  onCancel,
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      weightGrams: initialData?.weightGrams || "",
      rawMaterialType: initialData?.rawMaterialType || "",
      rawMaterialPricePerKg: initialData?.rawMaterialPricePerKg || "",
    },
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        weightGrams: initialData.weightGrams || "",
        rawMaterialType: initialData.rawMaterialType || "",
        rawMaterialPricePerKg: initialData.rawMaterialPricePerKg || "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        data-testid="product-form"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Cotter Pin 5mm"
                  {...field}
                  data-testid="input-product-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weightGrams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (grams)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="e.g., 10"
                  {...field}
                  data-testid="input-product-weight"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rawMaterialType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Raw Material Type</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Mild Steel, Aluminum"
                  {...field}
                  data-testid="input-material-type"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rawMaterialPricePerKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Cost (₹/kg)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="e.g., 55"
                  {...field}
                  data-testid="input-material-price"
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
            data-testid="button-cancel-product"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
            data-testid="button-save-product"
          >
            {isLoading ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
