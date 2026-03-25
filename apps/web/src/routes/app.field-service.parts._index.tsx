import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AlertTriangle, DollarSign, Package, Search } from "lucide-react";
import { z } from "zod";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fieldServiceApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  stock: z.enum(["all", "low", "ok"]).optional(),
});

export const Route = createFileRoute("/app/field-service/parts/_index")({
  validateSearch: searchSchema,
  component: PartsPage,
});

function PartsPage() {
  const { q: search = "", stock = "all" } = useSearch({ from: "/app/field-service/parts/_index" });
  const navigate = useNavigate({ from: "/app/field-service/parts/_index" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStock = (v: string) => navigate({ search: (p) => ({ ...p, stock: v === "all" ? undefined : (v as any) }) });

  const { data, isLoading } = useQuery({
    queryKey: ["field-service", "parts"],
    queryFn: () => fieldServiceApi.parts.list(),
  });

  const parts: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const filtered = parts.filter((p: any) => {
    const matchesSearch =
      !search ||
      (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.partNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase());
    const totalStock = (p.vanStock ?? 0) + (p.warehouseStock ?? 0);
    const isLow = totalStock <= (p.reorderPoint ?? 0);
    const matchesStock =
      stock === "all" || (stock === "low" && isLow) || (stock === "ok" && !isLow);
    return matchesSearch && matchesStock;
  });

  const lowStockCount = parts.filter((p: any) => {
    const stock = (p.vanStock ?? 0) + (p.warehouseStock ?? 0);
    return stock <= (p.reorderPoint ?? 0);
  }).length;

  const totalValue = parts.reduce((acc, p) => {
    const qty = (p.vanStock ?? 0) + (p.warehouseStock ?? 0);
    return acc + qty * (p.unitCost ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parts Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Track parts stock across vans and warehouse
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Parts</p>
                <p className="text-2xl font-bold">{parts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? "text-orange-500" : "text-green-500"}`} />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-600" : ""}`}>
                  {lowStockCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { month: "Oct", received: 245, consumed: 189, returned: 23 },
              { month: "Nov", received: 312, consumed: 234, returned: 18 },
              { month: "Dec", received: 198, consumed: 276, returned: 31 },
              { month: "Jan", received: 367, consumed: 312, returned: 28 },
              { month: "Feb", received: 289, consumed: 258, returned: 15 },
              { month: "Mar", received: 423, consumed: 341, returned: 42 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="received" fill="#10b981" name="Received" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consumed" fill="#6366f1" name="Consumed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" fill="#f59e0b" name="Returned" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle>All Parts</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {["all", "low", "ok"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStock(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      stock === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "all" ? "All Stock" : s === "low" ? "Low Stock" : "In Stock"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No parts found"
              description="No parts match your search."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Part Name</th>
                    <th className="pb-3 pr-4 font-medium">Part #</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Van Stock</th>
                    <th className="pb-3 pr-4 font-medium">Warehouse</th>
                    <th className="pb-3 pr-4 font-medium">Reorder Point</th>
                    <th className="pb-3 font-medium">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((part: any) => {
                    const vanStock = part.vanStock ?? 0;
                    const warehouseStock = part.warehouseStock ?? 0;
                    const reorderPoint = part.reorderPoint ?? 0;
                    const isLow = (vanStock + warehouseStock) <= reorderPoint;
                    return (
                      <tr key={part.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-medium">{part.name}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                          {part.partNumber ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="text-xs">
                            {part.category ?? "General"}
                          </Badge>
                        </td>
                        <td className={`py-3 pr-4 font-medium ${isLow ? "text-red-600" : ""}`}>
                          {vanStock}
                          {isLow && <AlertTriangle className="h-3.5 w-3.5 inline ml-1 text-red-500" />}
                        </td>
                        <td className={`py-3 pr-4 font-medium ${isLow ? "text-red-600" : ""}`}>
                          {warehouseStock}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{reorderPoint}</td>
                        <td className="py-3 text-muted-foreground font-mono text-xs">
                          {part.unitCost != null ? `$${part.unitCost.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
