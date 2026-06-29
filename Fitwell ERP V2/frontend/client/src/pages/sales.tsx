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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import SalesForm from "@/components/forms/sales-form";
import SalesTable from "@/components/tables/sales-table";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import type { SalesOrderWithItems } from "@shared/schema";

export default function Sales() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: salesOrders, isLoading } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSalesOrders,
  });

  const { data: parties } = useQuery({
    queryKey: ["/api/parties"],
    queryFn: api.getParties,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const createSalesOrderMutation = useMutation({
    mutationFn: api.createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Sales order created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sales order",
        variant: "destructive",
      });
    },
  });

  const fulfillOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.fulfillOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Order fulfilled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to fulfill order",
        variant: "destructive",
      });
    },
  });

  const deleteSalesOrderMutation = useMutation({
    mutationFn: api.deleteSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDeleteDialogOpen(false);
      setSelectedOrderId(null);
      toast({
        title: "Success",
        description: "Sales order deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete sales order",
        variant: "destructive",
      });
    },
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: api.cancelInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Invoice cancelled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel invoice",
        variant: "destructive",
      });
    },
  });

  const handleCreateSalesOrder = (data: any) => {
    console.log(data);
    createSalesOrderMutation.mutate(data);
  };

  const handleFulfillOrder = (orderId: number, fulfillments: any) => {
    fulfillOrderMutation.mutate({ id: orderId, data: { fulfillments } });
  };

  const handleDeleteOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedOrderId) {
      deleteSalesOrderMutation.mutate(selectedOrderId);
    }
  };

  const handleCancelInvoice = (orderId: number) => {
    cancelInvoiceMutation.mutate(orderId);
  };

  const handlePrintSalesOrder = async (orderId: number) => {
    try {
      // Fetch full order details with items
      const orderDetails: SalesOrderWithItems = await api.getSalesOrder(orderId);
      
      if (!orderDetails) {
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Sales Order", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Order Number
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Order #: ${orderDetails.orderNumber}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Order Information Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Order Information", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      // Order Date
      const orderDate = new Date(orderDetails.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFont("helvetica", "bold");
      doc.text("Order Date:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(orderDate, margin + 50, yPosition);
      yPosition += 8;

      // Status
      doc.setFont("helvetica", "bold");
      doc.text("Status:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      const statusText = orderDetails.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      doc.text(statusText, margin + 50, yPosition);
      yPosition += 10;

      // Party Information Section
      if (orderDetails.party) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Party Information", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        // Party Name
        doc.setFont("helvetica", "bold");
        doc.text("Party Name:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(orderDetails.party.name || "N/A", margin + 50, yPosition);
        yPosition += 8;

        // Address
        doc.setFont("helvetica", "bold");
        doc.text("Address:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        const addressText = `${orderDetails.party.address || "N/A"}, ${orderDetails.party.pinCode || ""}`;
        const addressLines = doc.splitTextToSize(addressText, pageWidth - margin * 2 - 50);
        doc.text(addressLines, margin + 50, yPosition);
        yPosition += addressLines.length * 7;

        // Phone Number
        doc.setFont("helvetica", "bold");
        doc.text("Phone Number:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(orderDetails.party.phoneNumber || "N/A", margin + 50, yPosition);
        yPosition += 8;

        // GST Number
        if (orderDetails.party.gstNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("GST Number:", margin, yPosition);
          doc.setFont("helvetica", "normal");
          doc.text(orderDetails.party.gstNumber, margin + 50, yPosition);
          yPosition += 10;
        } else {
          yPosition += 5;
        }
      }

      // Items Section
      if (orderDetails.items && orderDetails.items.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Order Items", margin, yPosition);
        yPosition += 10;

        // Table Header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Product Name", margin, yPosition);
        doc.text("Quantity", margin + 80, yPosition);
        doc.text("Fulfilled", margin + 120, yPosition);
        doc.text("Pending", margin + 160, yPosition);
        yPosition += 8;

        // Line under header
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Items
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        let totalQuantity = 0;
        let totalFulfilled = 0;

        orderDetails.items.forEach((item: any) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          const productName = item.product?.name || "Unknown Product";
          const quantity = item.quantity || 0;
          const fulfilled = item.fulfilled || 0;
          const pending = quantity - fulfilled;

          totalQuantity += quantity;
          totalFulfilled += fulfilled;

          // Product name (may need to wrap)
          const nameLines = doc.splitTextToSize(productName, 70);
          doc.text(nameLines, margin, yPosition);
          
          // If product name wraps, adjust yPosition
          const nameHeight = nameLines.length * 5;
          
          doc.text(quantity.toString(), margin + 80, yPosition);
          doc.text(fulfilled.toString(), margin + 120, yPosition);
          doc.text(pending.toString(), margin + 160, yPosition);
          
          yPosition += Math.max(nameHeight, 8);
        });

        yPosition += 5;
        
        // Summary line
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        doc.setFont("helvetica", "bold");
        doc.text("Total:", margin, yPosition);
        doc.text(totalQuantity.toString(), margin + 80, yPosition);
        doc.text(totalFulfilled.toString(), margin + 120, yPosition);
        doc.text((totalQuantity - totalFulfilled).toString(), margin + 160, yPosition);
        yPosition += 10;
      }

      // Footer
      yPosition = pageHeight - 30;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      // Save the PDF
      const fileName = `SalesOrder_${orderDetails.orderNumber.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "Sales order PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div data-testid="loading-sales">Loading sales orders...</div>;
  }

  return (
    <div data-testid="sales-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="sales-title">Sales Orders</CardTitle>
              <p
                className="text-muted-foreground text-sm mt-1 hidden sm:block"
                data-testid="sales-description"
              >
                Create and manage sales orders with order tracking and
                fulfillment
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="button-create-order"
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-4xl"
                data-testid="create-order-dialog"
              >
                <DialogHeader>
                  <DialogTitle>Create Sales Order</DialogTitle>
                </DialogHeader>
                <SalesForm
                  parties={parties || []}
                  products={products || []}
                  onSubmit={handleCreateSalesOrder}
                  isLoading={createSalesOrderMutation.isPending}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <SalesTable
            salesOrders={salesOrders || []}
            onFulfill={handleFulfillOrder}
            isFulfilling={fulfillOrderMutation.isPending}
            onDelete={handleDeleteOrder}
            onCancel={handleCancelInvoice}
            onPrint={handlePrintSalesOrder}
            isDeleting={deleteSalesOrderMutation.isPending}
            isCancelling={cancelInvoiceMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent data-testid="delete-sales-order-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales order? This action
              cannot be undone and will not restore inventory levels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
