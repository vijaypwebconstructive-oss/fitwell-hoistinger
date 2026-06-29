import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import ProductionForm from "@/components/forms/production-form";
import ProductionTable from "@/components/tables/production-table";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductionWithProduct } from "@shared/schema";

export default function Production() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProductionWithProduct | null>(null);
  const { toast } = useToast();

  const { data: production, isLoading } = useQuery({
    queryKey: ["/api/production"],
    queryFn: api.getProduction,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const createProductionMutation = useMutation({
    mutationFn: api.createProduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Production record created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create production record",
        variant: "destructive",
      });
    },
  });

  const updateProductionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateProduction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      toast({
        title: "Success",
        description: "Production record updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update production record",
        variant: "destructive",
      });
    },
  });

  const deleteProductionMutation = useMutation({
    mutationFn: api.deleteProduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
      toast({
        title: "Success",
        description: "Production record deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete production record",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduction = (data: any) => {
    createProductionMutation.mutate(data);
  };

  const handleEditProduction = (record: ProductionWithProduct) => {
    setSelectedRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduction = (data: any) => {
    if (selectedRecord) {
      updateProductionMutation.mutate({ id: selectedRecord.id, data });
    }
  };

  const handleDeleteProduction = (record: ProductionWithProduct) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRecord) {
      deleteProductionMutation.mutate(selectedRecord.id);
    }
  };

  if (isLoading) {
    return <div data-testid="loading-production">Loading production records...</div>;
  }

  return (
    <div data-testid="production-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="production-title">Production Records</CardTitle>
              <p className="text-muted-foreground text-sm mt-1 hidden sm:block" data-testid="production-description">
                Log daily manufacturing output and track production efficiency
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-production" className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="add-production-dialog">
                <DialogHeader>
                  <DialogTitle>Add Production Record</DialogTitle>
                </DialogHeader>
                <ProductionForm
                  products={products || []}
                  onSubmit={handleCreateProduction}
                  isLoading={createProductionMutation.isPending}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ProductionTable 
            production={production || []} 
            onEdit={handleEditProduction}
            onDelete={handleDeleteProduction}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="edit-production-dialog">
          <DialogHeader>
            <DialogTitle>Edit Production Record</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <ProductionForm
              products={products || []}
              defaultValues={{
                date: selectedRecord.date,
                productId: selectedRecord.productId,
                quantityKg: selectedRecord.quantityKg,
                weightGramsOverride: selectedRecord.weightGramsOverride || "",
                rawMaterialTypeOverride: selectedRecord.rawMaterialTypeOverride || "",
                rawMaterialPricePerKgOverride: selectedRecord.rawMaterialPricePerKgOverride || "",
              }}
              onSubmit={handleUpdateProduction}
              isLoading={updateProductionMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedRecord(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-production-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production record for {selectedRecord?.product?.name || "this product"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
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
