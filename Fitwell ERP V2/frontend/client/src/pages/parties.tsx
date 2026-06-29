import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Upload } from "lucide-react";
import PartyForm from "@/components/forms/party-form";
import PartiesTable from "@/components/tables/parties-table";
import BulkUpload from "@/components/forms/bulk-upload";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import type { Party } from "@shared/schema";

export default function Parties() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const { toast } = useToast();

  const { data: parties, isLoading } = useQuery({
    queryKey: ["/api/parties"],
    queryFn: api.getParties,
  });

  const createPartyMutation = useMutation({
    mutationFn: api.createParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Party created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create party",
        variant: "destructive",
      });
    },
  });

  const updatePartyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateParty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsEditDialogOpen(false);
      setSelectedParty(null);
      toast({
        title: "Success",
        description: "Party updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update party",
        variant: "destructive",
      });
    },
  });

  const deletePartyMutation = useMutation({
    mutationFn: api.deleteParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsDeleteDialogOpen(false);
      setSelectedParty(null);
      toast({
        title: "Success",
        description: "Party deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete party",
        variant: "destructive",
      });
    },
  });

  const handleCreateParty = (data: any) => {
    createPartyMutation.mutate(data);
  };

  const handleEditParty = (party: any) => {
    setSelectedParty(party);
    setIsEditDialogOpen(true);
  };

  const handleUpdateParty = (data: any) => {
    if (selectedParty) {
      updatePartyMutation.mutate({ id: selectedParty.id, data });
    }
  };

  const handleDeleteParty = (party: any) => {
    setSelectedParty(party);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteParty = () => {
    if (selectedParty) {
      deletePartyMutation.mutate(selectedParty.id);
    }
  };

  const handleBulkUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
    setIsBulkUploadOpen(false);
  };

  const handlePrintParty = (party: Party) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Party Details", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Party Information
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
    doc.text(party.name || "N/A", margin + 50, yPosition);
    yPosition += 8;

    // Address
    doc.setFont("helvetica", "bold");
    doc.text("Address:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(party.address || "N/A", pageWidth - margin * 2 - 50);
    doc.text(addressLines, margin + 50, yPosition);
    yPosition += addressLines.length * 7;

    // Pin Code
    doc.setFont("helvetica", "bold");
    doc.text("Pin Code:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(party.pinCode || "N/A", margin + 50, yPosition);
    yPosition += 8;

    // Phone Number
    doc.setFont("helvetica", "bold");
    doc.text("Phone Number:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(party.phoneNumber || "N/A", margin + 50, yPosition);
    yPosition += 10;

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
    const fileName = `Party_${party.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(fileName);

    toast({
      title: "Success",
      description: "Party details PDF downloaded successfully",
    });
  };

  if (isLoading) {
    return <div data-testid="loading-parties">Loading parties...</div>;
  }

  return (
    <div data-testid="parties-page">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle data-testid="parties-title">Party Master</CardTitle>
              <p className="text-muted-foreground text-sm mt-1 hidden sm:block" data-testid="parties-description">
                Manage your customers and suppliers directory
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-party" className="flex-1 sm:flex-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Party
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="add-party-dialog">
                  <DialogHeader>
                    <DialogTitle>Add New Party</DialogTitle>
                  </DialogHeader>
                  <PartyForm
                    onSubmit={handleCreateParty}
                    isLoading={createPartyMutation.isPending}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                {/* <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-bulk-upload-parties" className="flex-1 sm:flex-none">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger> */}
                <DialogContent className="max-w-4xl" data-testid="bulk-upload-parties-dialog">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Parties</DialogTitle>
                  </DialogHeader>
                  <BulkUpload
                    endpoint="/api/parties/bulk"
                    title="Bulk Upload Parties"
                    description="Upload multiple parties at once using an Excel file"
                    templateHeaders={['Party Name', 'Address', 'Pin Code', 'Phone Number', 'GST Number']}
                    onSuccess={handleBulkUploadSuccess}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PartiesTable 
            parties={parties || []} 
            onEdit={handleEditParty}
            onDelete={handleDeleteParty}
            onPrint={handlePrintParty}
          />
        </CardContent>
      </Card>

      {/* Edit Party Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="edit-party-dialog">
          <DialogHeader>
            <DialogTitle>Edit Party</DialogTitle>
          </DialogHeader>
          {selectedParty && (
            <PartyForm
              initialData={selectedParty}
              onSubmit={handleUpdateParty}
              isLoading={updatePartyMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedParty(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-party-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Party</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedParty?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteParty}
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
