/**
 * Serial Number Tracking
 *
 * Track individual items by serial number.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Hash,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Package,
  MapPin,
  ArrowRight,
  Download,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/serial")({
  component: SerialTrackingPage,
});

const MOCK_SERIAL_NUMBERS = [
  { serial: "SN-ELEC-4KTV-55-001", sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', status: "in_stock", warehouse: "Warehouse A", location: "A-12-3", purchaseDate: "Jan 15, 2024", warrantyExpiry: "Jan 15, 2026" },
  { serial: "SN-ELEC-4KTV-55-002", sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', status: "sold", warehouse: "-", location: "-", purchaseDate: "Jan 15, 2024", warrantyExpiry: "Jan 15, 2026", soldTo: "Customer #12345", soldDate: "Feb 20, 2024" },
  { serial: "SN-ELEC-LAP-15-001", sku: "ELEC-LAP-15", name: 'Laptop 15" Pro', status: "in_stock", warehouse: "Warehouse A", location: "A-08-1", purchaseDate: "Feb 1, 2024", warrantyExpiry: "Feb 1, 2026" },
  { serial: "SN-ELEC-LAP-15-002", sku: "ELEC-LAP-15", name: 'Laptop 15" Pro', status: "sold", warehouse: "-", location: "-", purchaseDate: "Feb 1, 2024", warrantyExpiry: "Feb 1, 2026", soldTo: "Customer #12346", soldDate: "Mar 5, 2024" },
  { serial: "SN-SPORT-BIKE-001", sku: "SPORT-BIKE-MTN", name: "Mountain Bike", status: "in_stock", warehouse: "Warehouse B", location: "B-12-1", purchaseDate: "Feb 10, 2024", warrantyExpiry: "Feb 10, 2025" },
  { serial: "SN-SPORT-BIKE-002", sku: "SPORT-BIKE-MTN", name: "Mountain Bike", status: "returned", warehouse: "Returns Center", location: "RC-01-1", purchaseDate: "Feb 10, 2024", warrantyExpiry: "Feb 10, 2025", returnDate: "Mar 1, 2024", returnReason: "Defective" },
  { serial: "SN-APPA-JKT-001", sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", status: "sold", warehouse: "-", location: "-", purchaseDate: "Feb 15, 2024", warrantyExpiry: "N/A", soldTo: "Customer #12347", soldDate: "Feb 28, 2024" },
  { serial: "SN-HOME-SOF-001", sku: "HOME-SOF-3S", name: "3-Seater Sofa", status: "in_stock", warehouse: "Warehouse B", location: "B-05-2", purchaseDate: "Jan 20, 2024", warrantyExpiry: "Jan 20, 2027" },
];

function SerialTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: serialData, isError, refetch} = useQuery({
    queryKey: ["inventory", "serial"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory/serial?page=1&limit=200`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch serial numbers");
      return res.json() as Promise<{ data: typeof MOCK_SERIAL_NUMBERS; total: number }>;
    },
  });

  const serialNumbers = serialData?.data?.length ? serialData.data : MOCK_SERIAL_NUMBERS;

  const filteredSerials = serialNumbers.filter((item) => {
    const matchesSearch =
      item.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge variant="success" size="sm">In Stock</Badge>;
      case "sold":
        return <Badge variant="info" size="sm">Sold</Badge>;
      case "returned":
        return <Badge variant="warning" size="sm">Returned</Badge>;
      case "in_transit":
        return <Badge variant="default" size="sm">In Transit</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: serialData?.total ?? serialNumbers.length,
    in_stock: serialNumbers.filter((s: typeof MOCK_SERIAL_NUMBERS[0]) => s.status === "in_stock").length,
    sold: serialNumbers.filter((s: typeof MOCK_SERIAL_NUMBERS[0]) => s.status === "sold").length,
    returned: serialNumbers.filter((s: typeof MOCK_SERIAL_NUMBERS[0]) => s.status === "returned").length,
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Serial Number Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Track individual items by serial number
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add Serial Number
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Tracked</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-green-600">In Stock</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.in_stock}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600">Sold</p>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.sold}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-600">Returned</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.returned}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by serial, SKU, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status ({statusCounts.all})</option>
          <option value="in_stock">In Stock ({statusCounts.in_stock})</option>
          <option value="sold">Sold ({statusCounts.sold})</option>
          <option value="returned">Returned ({statusCounts.returned})</option>
        </select>
      </div>

      {/* Serial Numbers Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Serial Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Purchase Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Warranty Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSerials.map((item) => (
                  <tr key={item.serial} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="font-mono font-medium text-foreground">{item.serial}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">
                      {item.warehouse !== "-" ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.location}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.purchaseDate}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.warrantyExpiry}</td>
                    <td className="px-4 py-3">
                      {item.status === "sold" && (
                        <div className="text-sm">
                          <p className="text-foreground">Sold to: {item.soldTo}</p>
                          <p className="text-xs text-muted-foreground">{item.soldDate}</p>
                        </div>
                      )}
                      {item.status === "returned" && (
                        <div className="text-sm">
                          <p className="text-yellow-600">Return: {item.returnReason}</p>
                          <p className="text-xs text-muted-foreground">{item.returnDate}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
