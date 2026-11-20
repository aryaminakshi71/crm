/**
 * eCommerce Products Index
 *
 * Browse, search, and manage store products.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import { ecommerceApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/ecommerce/products/_index")({
  validateSearch: searchSchema,
  component: ProductsIndexPage,
});

interface Product {
  id: string;
  name?: string;
  title?: string;
  sku?: string;
  category?: string;
  price?: number;
  basePrice?: number;
  stock?: number;
  inventoryCount?: number;
  status?: string;
  isActive?: boolean;
  imageUrl?: string;
}

const _MOCK_PRODUCTS: Product[] = [
  { id: "P1", name: '55" 4K Smart TV', sku: "TV-4K-55", category: "Electronics", price: 499.99, stock: 23, status: "active" },
  { id: "P2", name: 'Laptop 15" Pro', sku: "LT-PRO-15", category: "Electronics", price: 999.99, stock: 12, status: "active" },
  { id: "P3", name: "3-Seater Sofa", sku: "SF-3ST-GRY", category: "Home & Garden", price: 999.00, stock: 5, status: "active" },
  { id: "P4", name: "Mountain Bike", sku: "BK-MTN-21", category: "Sports", price: 599.99, stock: 0, status: "active" },
  { id: "P5", name: "Winter Jacket", sku: "JK-WIN-M", category: "Apparel", price: 149.99, stock: 45, status: "active" },
  { id: "P6", name: "Wireless Headphones", sku: "HP-WRL-BLK", category: "Electronics", price: 79.99, stock: 30, status: "draft" },
  { id: "P7", name: "Vintage Lamp", sku: "LM-VNT-01", category: "Home & Garden", price: 59.99, stock: 8, status: "archived" },
];

function getName(p: Product) { return p.name ?? p.title ?? "Untitled"; }
function getPrice(p: Product) { return p.price ?? p.basePrice ?? 0; }
function getStock(p: Product) { return p.stock ?? p.inventoryCount ?? 0; }
function getStatus(p: Product) {
  if (p.status) return p.status;
  if (p.isActive === true) return "active";
  if (p.isActive === false) return "draft";
  return "active";
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "default"> = {
    active: "success",
    draft: "warning",
    archived: "default",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="danger" size="sm">Out of stock</Badge>;
  if (stock < 5) return <Badge variant="warning" size="sm">{stock} left</Badge>;
  return <span className="text-sm text-foreground">{stock}</span>;
}

const PAGE_SIZE = 50;

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────

function CSVImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const EXPECTED_COLS = ["name", "sku", "price", "stock", "category"];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = parseCSV(text);
        setCsvData(parsed);
      } catch {
        toast.error("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    let success = 0;
    let failed = 0;
    for (const row of csvData) {
      try {
        await ecommerceApi.products.create({
          name: row.name,
          sku: row.sku,
          price: row.price ? parseFloat(row.price) : 0,
          stock: row.stock ? parseInt(row.stock, 10) : 0,
          category: row.category,
        });
        success++;
      } catch {
        failed++;
      }
    }
    setImporting(false);
    setResults({ success, failed });
    qc.invalidateQueries({ queryKey: ["ecommerce-products-index"] });
    if (failed === 0) {
      toast.success(`Imported ${success} product${success !== 1 ? "s" : ""} successfully.`);
      onImported();
    } else {
      toast.warning(`Imported ${success} product${success !== 1 ? "s" : ""}; ${failed} failed.`);
    }
  }

  const previewRows = csvData.slice(0, 5);
  const headers = csvData.length > 0 ? Object.keys(csvData[0]) : EXPECTED_COLS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold">Import Products from CSV</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* File upload */}
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Expected columns:{" "}
              <span className="font-mono text-xs">{EXPECTED_COLS.join(", ")}</span>
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/70 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Choose CSV File
              </label>
              {fileName && (
                <span className="text-sm text-muted-foreground">{fileName}</span>
              )}
            </div>
          </div>

          {/* Preview table */}
          {csvData.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Preview ({Math.min(5, csvData.length)} of {csvData.length} rows)
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {headers.map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        {headers.map((h) => (
                          <td key={h} className="px-3 py-2 text-xs text-foreground">
                            {row[h] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result feedback */}
          {results && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                results.failed === 0
                  ? "bg-green-500/10 text-green-600"
                  : "bg-yellow-500/10 text-yellow-600"
              }`}
            >
              {results.failed === 0
                ? `All ${results.success} products imported successfully.`
                : `${results.success} imported, ${results.failed} failed.`}
            </div>
          )}

          {/* Import progress */}
          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent" />
              Importing {csvData.length} products…
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleImport}
            disabled={csvData.length === 0 || importing || results?.failed === 0}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            {importing
              ? "Importing…"
              : `Import${csvData.length > 0 ? ` ${csvData.length} Products` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

function ProductsIndexPage() {
  const { q: searchQuery = "", category: filterStatus = "all", page = 1 } = useSearch({ from: "/app/ecommerce/products/_index" });
  const navigate = useNavigate({ from: "/app/ecommerce/products" });
  const setSearchQuery = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setFilterStatus = (v: string) => navigate({ search: (p) => ({ ...p, category: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const qc = useQueryClient();

  const PRODUCTS_KEY = ["ecommerce-products-index", filterStatus, page];

  const createProduct = useMutation({
    mutationFn: (payload: any) => ecommerceApi.products.create(payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const previous = qc.getQueryData(PRODUCTS_KEY);
      qc.setQueryData(PRODUCTS_KEY, (old: any) => ({
        ...old,
        data: [{ ...payload, id: `temp-${Date.now()}` }, ...(old?.data ?? [])],
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(PRODUCTS_KEY, ctx.previous);
      toast.error("Failed to create product");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["ecommerce-products-index"] }),
    onSuccess: () => toast.success("Product created"),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => ecommerceApi.products.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const previous = qc.getQueryData(PRODUCTS_KEY);
      qc.setQueryData(PRODUCTS_KEY, (old: any) => ({
        ...old,
        data: (old?.data ?? []).filter((item: any) => item.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(PRODUCTS_KEY, ctx.previous);
      toast.error("Failed to delete product");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["ecommerce-products-index"] }),
    onSuccess: () => toast.success("Product deleted"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: () =>
      ecommerceApi.products.list({
        page,
        limit: PAGE_SIZE,
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const products: Product[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      getName(p).toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || getStatus(p) === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalProducts = products.length;
  const activeListings = products.filter((p) => getStatus(p) === "active").length;
  const outOfStock = products.filter((p) => getStock(p) === 0).length;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load products. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteProduct.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => setShowImportModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">{totalProducts} products in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImportModal(true)}
          >
            Import CSV
          </Button>
          <Link to="/app/ecommerce/products/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Products</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalProducts}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{activeListings}</p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{outOfStock}</p>
              </div>
              <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, SKU, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Products Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No products found</p>
              <Link to="/app/ecommerce/products/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={getName(product)}
                              className="h-9 w-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                              {getInitials(getName(product))}
                            </div>
                          )}
                          <span className="text-sm font-medium text-foreground">{getName(product)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{product.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{product.category ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">${getPrice(product).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center"><StockBadge stock={getStock(product)} /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={getStatus(product)} /></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link to="/app/ecommerce/products/$id" params={{ id: product.id }}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => setDeleteTarget({ id: product.id, name: getName(product) })}
                            loading={deleteProduct.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
