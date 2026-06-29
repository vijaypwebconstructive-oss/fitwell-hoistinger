import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const partyFormSchema = z.object({
  name: z.string().min(1, "Party name is required"),
  address: z.string().min(1, "Address is required"),
  pinCode: z.string().min(1, "PIN code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  gstNumber: z.string().optional(),
});

type PartyFormData = z.infer<typeof partyFormSchema>;

interface PartyFormProps {
  onSubmit: (data: PartyFormData) => void;
  isLoading: boolean;
  initialData?: Partial<PartyFormData>;
  onCancel?: () => void;
}

export default function PartyForm({ onSubmit, isLoading, initialData, onCancel }: PartyFormProps) {
  const form = useForm<PartyFormData>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      pinCode: initialData?.pinCode || "",
      phoneNumber: initialData?.phoneNumber || "",
      gstNumber: initialData?.gstNumber || "",
    },
  });

  const handleSubmit = (data: PartyFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" data-testid="party-form">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ABC Hardware" {...field} data-testid="input-party-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Full address" {...field} data-testid="textarea-party-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pinCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PIN Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 400001" {...field} data-testid="input-party-pincode" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., +91 9876543210" {...field} data-testid="input-party-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gstNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GST Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 27AABCU9603R1ZX" {...field} data-testid="input-party-gst" />
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
            data-testid="button-cancel-party"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading} data-testid="button-save-party">
            {isLoading ? "Saving..." : "Save Party"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
