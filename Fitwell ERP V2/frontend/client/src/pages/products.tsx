import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload } from "lucide-react";
import ProductForm from "@/components/forms/product-form";
import ProductsTable from "@/components/tables/products-table";
import BulkUpload from "@/components/forms/bulk-upload";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const createProductMutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = (data: any) => {
    createProductMutation.mutate(data);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = (data: any) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, data });
    }
  };

  const handleDeleteProduct = (id: number) => {
    deleteProductMutation.mutate(id);
  };

  const handleBulkUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    setIsBulkUploadOpen(false);
  };

  if (isLoading) {
    return <div data-testid="loading-products">Loading products...</div>;
  }

  return (
    <div data-testid="products-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="products-title">Product Master</CardTitle>
              <p className="text-muted-foreground text-sm mt-1 hidden sm:block" data-testid="products-description">
                Manage your product catalog with weight, material, and cost information
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-product" className="flex-1 sm:flex-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="add-product-dialog">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <ProductForm
                    onSubmit={handleCreateProduct}
                    isLoading={createProductMutation.isPending}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-bulk-upload-products" className="flex-1 sm:flex-none">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl" data-testid="bulk-upload-products-dialog">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Products</DialogTitle>
                  </DialogHeader>
                  <BulkUpload
                    endpoint="/api/products/bulk"
                    title="Bulk Upload Products"
                    description="Upload multiple products at once using an Excel file"
                    templateHeaders={['Product Name', 'Weight (grams)', 'Material Type', 'Material Price/KG']}
                    onSuccess={handleBulkUploadSuccess}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products || []}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            isDeleting={deleteProductMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="edit-product-dialog">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              initialData={selectedProduct}
              onSubmit={handleUpdateProduct}
              isLoading={updateProductMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
