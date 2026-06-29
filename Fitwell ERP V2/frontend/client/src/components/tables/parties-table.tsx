import { Badge } from "@/components/ui/badge";
import { Edit, Phone, MapPin, Trash2, Printer } from "lucide-react";
import ResponsiveDataTable from "@/components/ui/responsive-data-table";
import type { Party } from "@shared/schema";

interface PartiesTableProps {
  parties: Party[];
  onEdit: (party: Party) => void;
  onDelete: (party: Party) => void;
  onPrint: (party: Party) => void;
}

export default function PartiesTable({ parties, onEdit, onDelete, onPrint }: PartiesTableProps) {
  const columns = [
    {
      key: 'name' as keyof Party,
      label: 'Party Name',
      className: 'font-medium',
    },
    {
      key: 'phoneNumber' as keyof Party,
      label: 'Contact',
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'address' as keyof Party,
      label: 'Location',
      render: (value: string, party: Party) => (
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="truncate max-w-xs">{value}, {party.pinCode}</span>
        </div>
      ),
    },
    {
      key: 'gstNumber' as keyof Party,
      label: 'GST Number',
      render: (value: string | null) => 
        value ? (
          <Badge variant="secondary">{value}</Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
  ];

  const actions = [
    {
      label: 'Print',
      icon: <Printer className="w-4 h-4" />,
      onClick: (party: Party) => onPrint(party),
      variant: 'ghost' as const,
      testId: (party: Party) => `button-print-party-${party.id}`,
    },
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: (party: Party) => onEdit(party),
      variant: 'ghost' as const,
      testId: (party: Party) => `button-edit-party-${party.id}`,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (party: Party) => onDelete(party),
      variant: 'ghost' as const,
      testId: (party: Party) => `button-delete-party-${party.id}`,
    },
  ];

  return (
    <ResponsiveDataTable
      data={parties}
      columns={columns}
      actions={actions}
      emptyMessage="No parties found. Add your first customer or supplier to get started."
      testId="parties-table"
      getRowTestId={(party) => `party-row-${party.id}`}
    />
  );
}