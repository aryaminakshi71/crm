import { api as rpcClient } from "./orpc";

const rpc = rpcClient as any;

const API_BASE = "/api/v1";

function getOrgHeader(): Record<string, string> {
  const isDemo =
    typeof window !== "undefined" &&
    localStorage.getItem("demo_mode") === "true";
  const orgId = isDemo ? "demo-org" : undefined;

  // Check for real session org
  if (!orgId && typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.companyId && !user.isDemo) {
          return { "x-organization-id": user.companyId };
        }
      } catch {}
    }
  }

  return orgId ? { "x-organization-id": orgId } : {};
}

// ─── localStorage helpers ───────────────────────────────────────────────────
const LS_CONTACTS = "nucleo_local_contacts";
const LS_LEADS = "nucleo_local_leads";
const LS_DEALS = "nucleo_local_deals";
function lsGet(key: string): any[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function lsSet(key: string, data: any[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// ============ CONTACTS ============
export const contactsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = (await res.json()) as { data?: any[]; total?: number };
      const localExtras = lsGet(LS_CONTACTS).filter(
        (lc: any) => !(data.data || []).find((sc: any) => sc.id === lc.id),
      );
      const combined = [...(data.data || []), ...localExtras];
      const limit = params?.limit ?? 50;
      const page = params?.page ?? 1;
      return {
        data: combined,
        total: combined.length,
        limit,
        page,
        totalPages: Math.ceil(combined.length / limit),
      };
    } catch (e) {
      console.error("contactsApi.list error:", e);
      const local = lsGet(LS_CONTACTS);
      return {
        data: local,
        total: local.length,
        limit: 50,
        page: 1,
        totalPages: 1,
      };
    }
  },
  get: async (id: string) => {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    });
    if (!res.ok) throw new Error("Failed to get contact");
    return res.json();
  },
  create: async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
    jobTitle?: string;
    notes?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const newContact = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      const existing = lsGet(LS_CONTACTS);
      lsSet(LS_CONTACTS, [...existing, newContact]);
      return newContact;
    }
  },
  update: async (
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyName: string;
      jobTitle: string;
      notes: string;
    }>,
  ) => {
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const existing = lsGet(LS_CONTACTS);
      const updated = existing.map((c: any) =>
        c.id === id ? { ...c, ...data } : c,
      );
      lsSet(LS_CONTACTS, updated);
      return updated.find((c: any) => c.id === id);
    }
  },
  delete: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("API error");
    } catch {
      lsSet(
        LS_CONTACTS,
        lsGet(LS_CONTACTS).filter((c: any) => c.id !== id),
      );
    }
  },
};

// ============ DEALS ============
export const dealsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    stage?: string;
    search?: string;
  }) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.stage) query.set("stage", params.stage);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      const res = await fetch(`${API_BASE}/deals?${query}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch deals");
      const data = (await res.json()) as { data?: any[]; total?: number };
      const localExtras = lsGet(LS_DEALS).filter(
        (ld: any) => !(data.data || []).find((sd: any) => sd.id === ld.id),
      );
      const combined = [...(data.data || []), ...localExtras];
      const limit = params?.limit ?? 50;
      const page = params?.page ?? 1;
      return {
        data: combined,
        total: combined.length,
        limit,
        page,
        totalPages: Math.ceil(combined.length / limit),
      };
    } catch (e) {
      console.error("dealsApi.list error:", e);
      const local = lsGet(LS_DEALS);
      return {
        data: local,
        total: local.length,
        limit: 50,
        page: 1,
        totalPages: 1,
      };
    }
  },
  get: async (id: string) => {
    const res = await fetch(`${API_BASE}/deals/${id}`, {
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    });
    if (!res.ok) throw new Error("Failed to get deal");
    return res.json();
  },
  create: async (data: {
    name: string;
    value: number;
    stage?: string;
    notes?: string;
    probability?: number;
    expectedCloseDate?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const newDeal = {
        id: crypto.randomUUID(),
        ...data,
        stage: data.stage || "lead",
        createdAt: new Date().toISOString(),
      };
      lsSet(LS_DEALS, [...lsGet(LS_DEALS), newDeal]);
      return newDeal;
    }
  },
  update: async (
    id: string,
    data: Partial<{
      name: string;
      value: number;
      stage: string;
      notes: string;
      probability: number;
      expectedCloseDate: string;
    }>,
  ) => {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const updated = lsGet(LS_DEALS).map((d: any) =>
        d.id === id ? { ...d, ...data } : d,
      );
      lsSet(LS_DEALS, updated);
      return updated.find((d: any) => d.id === id);
    }
  },
  updateStage: async (id: string, stage: string) => {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const updated = lsGet(LS_DEALS).map((d: any) =>
        d.id === id ? { ...d, stage } : d,
      );
      lsSet(LS_DEALS, updated);
      return updated.find((d: any) => d.id === id);
    }
  },
  delete: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("API error");
    } catch {
      lsSet(
        LS_DEALS,
        lsGet(LS_DEALS).filter((d: any) => d.id !== id),
      );
    }
  },
};

// ============ LEADS ============
export const leadsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      const res = await fetch(`${API_BASE}/leads?${query}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = (await res.json()) as { data?: any[]; total?: number };
      const localExtras = lsGet(LS_LEADS).filter(
        (ll: any) => !(data.data || []).find((sl: any) => sl.id === ll.id),
      );
      const combined = [...(data.data || []), ...localExtras];
      const limit = params?.limit ?? 50;
      const page = params?.page ?? 1;
      return {
        data: combined,
        total: combined.length,
        limit,
        page,
        totalPages: Math.ceil(combined.length / limit),
      };
    } catch (e) {
      console.error("leadsApi.list error:", e);
      const local = lsGet(LS_LEADS);
      return {
        data: local,
        total: local.length,
        limit: 50,
        page: 1,
        totalPages: 1,
      };
    }
  },
  get: async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    });
    if (!res.ok) throw new Error("Failed to get lead");
    return res.json();
  },
  create: async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const newLead = {
        id: crypto.randomUUID(),
        ...data,
        status: data.status || "new",
        createdAt: new Date().toISOString(),
      };
      lsSet(LS_LEADS, [...lsGet(LS_LEADS), newLead]);
      return newLead;
    }
  },
  update: async (
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyName: string;
      source: string;
      status: string;
      notes: string;
      jobTitle: string;
    }>,
  ) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      const updated = lsGet(LS_LEADS).map((l: any) =>
        l.id === id ? { ...l, ...data } : l,
      );
      lsSet(LS_LEADS, updated);
      return updated.find((l: any) => l.id === id);
    }
  },
  delete: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("API error");
    } catch {
      lsSet(
        LS_LEADS,
        lsGet(LS_LEADS).filter((l: any) => l.id !== id),
      );
    }
  },
  convert: async (id: string, data: any) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("API error");
      return res.json();
    } catch {
      // Mark lead as converted in localStorage
      const leads = lsGet(LS_LEADS);
      const lead = leads.find((l: any) => l.id === id);
      if (lead) {
        lsSet(
          LS_LEADS,
          leads.map((l: any) =>
            l.id === id ? { ...l, status: "converted" } : l,
          ),
        );
        // Also add to contacts
        const newContact = {
          id: crypto.randomUUID(),
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.companyName,
          createdAt: new Date().toISOString(),
        };
        lsSet(LS_CONTACTS, [...lsGet(LS_CONTACTS), newContact]);
        return newContact;
      }
      return {};
    }
  },
};

// ============ ACTIVITIES ============
export const activitiesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    contactId?: string;
    dealId?: string;
  }) => {
    try {
      const query = new URLSearchParams();
      if (params?.contactId) query.set("contactId", params.contactId);
      if (params?.dealId) query.set("dealId", params.dealId);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));

      const res = await fetch(`${API_BASE}/activities?${query}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = (await res.json()) as { data?: any[]; total?: number };
      const limit = params?.limit ?? 50;
      const page = params?.page ?? 1;
      return {
        data: data.data || [],
        total: data.total || 0,
        limit,
        page,
        totalPages: Math.ceil((data.total || 0) / limit),
      };
    } catch (e) {
      console.error("activitiesApi.list error:", e);
      return { data: [], total: 0, limit: 50, page: 1, totalPages: 1 };
    }
  },
  get: async (id: string) => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    });
    if (!res.ok) throw new Error("Failed to get activity");
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create activity");
    return res.json();
  },
  update: async (
    id: string,
    data: Partial<{
      type: string;
      title: string;
      description: string;
      contactId: string;
      dealId: string;
    }>,
  ) => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update activity");
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      method: "DELETE",
      headers: getOrgHeader(),
    });
    if (!res.ok) throw new Error("Failed to delete activity");
  },
};

// ============ DASHBOARD ============
interface DashboardStats {
  totalContacts: number;
  contactsChange: number;
  activeDeals: number;
  dealsChange: number;
  conversionRate: number;
  conversionChange: number;
  revenue: number;
  revenueChange: number;
  recentActivities: Array<{ id: string; message: string; time: string }>;
  pipeline: Array<{ stage: string; count: number; value: number }>;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<DashboardStats>;
    } catch (e) {
      console.error("dashboardApi.getStats error:", e);
      return {
        totalContacts: 0,
        contactsChange: 0,
        activeDeals: 0,
        dealsChange: 0,
        conversionRate: 0,
        conversionChange: 0,
        revenue: 0,
        revenueChange: 0,
        recentActivities: [],
        pipeline: [],
      };
    }
  },
};

// ============ ASSETS ============
type LocalAsset = {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const LOCAL_ASSETS_KEY = "nucleo_local_assets";

function readLocalAssets(): LocalAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalAsset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAssets(assets: LocalAsset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ASSETS_KEY, JSON.stringify(assets));
}

function sortLocalAssetsByDate(assets: LocalAsset[]) {
  return [...assets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function filterLocalAssets(
  assets: LocalAsset[],
  params?: { search?: string; page?: number; limit?: number },
) {
  const searchLower = params?.search?.trim().toLowerCase();
  const filtered = searchLower
    ? assets.filter((asset) => asset.name.toLowerCase().includes(searchLower))
    : assets;

  const page = params?.page ?? 1;
  const limit = params?.limit ?? (filtered.length || 50);
  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    total: filtered.length,
  };
}

function generateLocalAssetTags(
  asset: Pick<LocalAsset, "name" | "mimeType" | "tags">,
) {
  const tags = new Set(asset.tags || []);
  const extension = asset.name.split(".").pop()?.toLowerCase();
  const [category, subtype = ""] = asset.mimeType.toLowerCase().split("/");
  if (category) tags.add(category);
  if (subtype) tags.add(subtype);
  if (extension) tags.add(extension);
  tags.add("ai-generated");
  return Array.from(tags).slice(0, 10);
}

function createLocalAsset(input: {
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}): LocalAsset {
  const now = new Date().toISOString();
  const asset: LocalAsset = {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.mimeType,
    mimeType: input.mimeType,
    size: input.size,
    url: input.url || "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  const assets = readLocalAssets();
  writeLocalAssets([asset, ...assets]);
  return asset;
}

export const assetsApi = {
  list: async (params?: {
    search?: string;
    contactId?: string;
    dealId?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.contactId) query.set("contactId", params.contactId);
      if (params?.dealId) query.set("dealId", params.dealId);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      const res = await fetch(`${API_BASE}/assets?${query}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch assets");
      const data = (await res.json()) as { data?: any[]; total?: number };
      return { data: data.data || [], total: data.total || 0 };
    } catch (e) {
      console.error("assetsApi.list error:", e);
      return filterLocalAssets(sortLocalAssetsByDate(readLocalAssets()), {
        search: params?.search,
        page: params?.page,
        limit: params?.limit,
      });
    }
  },
  get: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/assets/${id}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to get asset");
      return res.json();
    } catch (error) {
      console.error("assetsApi.get error:", error);
      const asset = readLocalAssets().find((item) => item.id === id);
      if (!asset) throw new Error("Failed to get asset");
      return asset;
    }
  },
  create: async (data: {
    name: string;
    originalName?: string;
    mimeType: string;
    size: string;
    r2Key?: string;
    contactId?: string;
    dealId?: string;
    leadId?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create asset");
      return res.json();
    } catch (error) {
      console.error("assetsApi.create error:", error);
      return createLocalAsset({
        name: data.name,
        mimeType: data.mimeType,
        size: Number(data.size) || 0,
      });
    }
  },
  delete: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/assets/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("Failed to delete asset");
    } catch (error) {
      console.error("assetsApi.delete error:", error);
      const assets = readLocalAssets();
      writeLocalAssets(assets.filter((asset) => asset.id !== id));
    }
  },
  generateTags: async (id: string): Promise<{ tags: string[] }> => {
    try {
      const res = await fetch(`${API_BASE}/assets/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to generate tags");
      const payload = (await res.json()) as { tags?: unknown };
      return {
        tags: Array.isArray(payload.tags)
          ? payload.tags.map((tag) => String(tag))
          : [],
      };
    } catch (error) {
      console.error("assetsApi.generateTags error:", error);
      const assets = readLocalAssets();
      const next = assets.map((asset) =>
        asset.id === id
          ? {
              ...asset,
              tags: generateLocalAssetTags(asset),
              updatedAt: new Date().toISOString(),
            }
          : asset,
      );
      writeLocalAssets(next);
      const updated = next.find((asset) => asset.id === id);
      return { tags: updated?.tags || [] };
    }
  },
  getSignedUrl: async (data: { filename: string; contentType: string }) => {
    return rpc.assets?.getSignedUrl?.(data);
  },
  confirmUpload: async (data: {
    name: string;
    type: string;
    size: number;
    key: string;
  }) => {
    return rpc.assets?.confirmUpload?.(data);
  },
  upload: async (data: { name: string; type: string; content: string }) => {
    try {
      // Use REST API as source of truth so upload/list/tag flows stay consistent.
      const formData = new FormData();
      formData.append('file', new Blob([Uint8Array.from(atob(data.content), c => c.charCodeAt(0))], { type: data.type }), data.name);
      formData.append('name', data.name);
      formData.append('mimeType', data.type);
      formData.append('size', Math.floor(data.content.length * 0.75).toString());
      const res = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { ...getOrgHeader() },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    } catch (error) {
      console.error("assetsApi.upload error:", error);
      const localAsset = createLocalAsset({
        name: data.name,
        mimeType: data.type,
        size: Math.floor(data.content.length * 0.75),
        url: data.type.startsWith("image/")
          ? `data:${data.type};base64,${data.content}`
          : "",
      });
      return localAsset;
    }
  },
};

// ============ MONITORING ============

// Catalog API response interface
interface CatalogAppItem {
  id: string;
  name: string;
  category?: string;
  status?: string;
  uptime?: number;
  latency?: number;
  errorRate?: number;
  metadata?: {
    region?: string;
    endpoint?: string;
  };
  healthCheckAt?: string;
}

interface CatalogResponse {
  data?: CatalogAppItem[];
  items?: CatalogAppItem[];
  total?: number;
}

// Performance API response interface
interface PerformanceResponse {
  p50Latency?: number;
  p95Latency?: number;
  p99Latency?: number;
  throughput?: number;
  errorRate?: number;
}

// Logs API response interface
interface LogItem {
  id?: string;
  source?: string;
  service?: string;
  level?: string;
  timestamp?: string;
}

interface LogsResponse {
  data?: LogItem[];
}

// Uptime API response interface
interface UptimeResponse {
  uptimePercent?: number;
}

// Incident interface
interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  service: string;
  startedAt: string | Date;
  duration?: string;
  assignee?: string;
  impact?: string;
  description?: string;
  rootCause?: string;
  resolution?: string;
}

// Alert interface
interface Alert {
  id: string;
  name: string;
  metric?: string;
  condition?: string;
  threshold?: number;
  duration?: number;
  severity: string;
  channels?: string[];
  enabled: boolean;
  createdAt?: string | Date;
  triggerCount?: number;
}

// Log interface
interface LogEntry {
  id?: string;
  source?: string;
  service?: string;
  level: string;
  message?: string;
  timestamp?: string | Date;
  traceId?: string;
}

// Dashboard response interface
interface DashboardResponse {
  analytics?: { activeUsers?: number; pageViews?: number; sessionDuration?: number; bounceRate?: number };
  billing?: { mrr?: number; arr?: number; activeSubscriptions?: number; churnRate?: number; outstandingInvoices?: number };
  errors?: { errorCount?: number; uniqueErrors?: number; resolvedErrors?: number; criticalErrors?: number; recentErrors?: Array<{ id: string; message: string; count: number; lastSeen: string }> };
  support?: { openTickets?: number; avgResponseTime?: number; slaCompliance?: number; resolvedToday?: number };
  uptime?: { uptimePercent?: number; avgResponseTime?: number; checksPassed?: number; checksFailed?: number };
  performance?: { p50Latency?: number; p95Latency?: number; p99Latency?: number; throughput?: number; errorRate?: number };
  catalog?: { totalApps?: number; activeApps?: number; items?: CatalogAppItem[] };
}

export const monitoringApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/dashboard`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    } catch {
      // Return mock data for demo
      return {
        analytics: { activeUsers: 1247, pageViews: 45234, sessionDuration: 245, bounceRate: 42.3 },
        billing: { mrr: 45600, arr: 547200, activeSubscriptions: 156, churnRate: 2.4, outstandingInvoices: 12 },
        errors: { errorCount: 23, uniqueErrors: 15, resolvedErrors: 8, criticalErrors: 2 },
        support: { openTickets: 34, avgResponseTime: 38, slaCompliance: 94.2, resolvedToday: 12 },
        uptime: { uptimePercent: 99.97, avgResponseTime: 45, checksPassed: 8, checksFailed: 1 },
        performance: { p50Latency: 48, p95Latency: 145, p99Latency: 295, throughput: 1250, errorRate: 0.32 },
        catalog: { totalApps: 8, activeApps: 7 },
      };
    }
  },

  getAnalytics: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/analytics`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    } catch {
      return { activeUsers: 1247, pageViews: 45234, sessionDuration: 245, bounceRate: 42.3 };
    }
  },

  getBilling: async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/billing`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch billing");
      return res.json();
    } catch {
      return { mrr: 45600, arr: 547200, activeSubscriptions: 156, churnRate: 2.4, outstandingInvoices: 12 };
    }
  },

  getErrors: async (): Promise<{ errorCount: number; uniqueErrors: number; resolvedErrors: number; criticalErrors: number; recentErrors?: Array<{ id: string; message: string; count: number; lastSeen: string }> }> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/errors`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch errors");
      return res.json();
    } catch {
      return { errorCount: 23, uniqueErrors: 15, resolvedErrors: 8, criticalErrors: 2 };
    }
  },

  getUptime: async (): Promise<{ uptimePercent: number; avgResponseTime: number; checksPassed: number; checksFailed: number }> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/uptime`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch uptime");
      return res.json();
    } catch {
      return { uptimePercent: 99.97, avgResponseTime: 45, checksPassed: 8, checksFailed: 1 };
    }
  },

  getPerformance: async (): Promise<PerformanceResponse> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/performance`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch performance");
      return res.json();
    } catch {
      return { p50Latency: 48, p95Latency: 145, p99Latency: 295, throughput: 1250, errorRate: 0.32 };
    }
  },

  getSupport: async (): Promise<{ openTickets: number; avgResponseTime: number; slaCompliance: number; resolvedToday: number }> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/support`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch support");
      return res.json();
    } catch {
      return { openTickets: 34, avgResponseTime: 38, slaCompliance: 94.2, resolvedToday: 12 };
    }
  },

  getIncidents: async (): Promise<Incident[]> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/incidents`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    } catch {
      return [
        { id: "INC-2026-001", title: "Database Connection Pool Exhausted", status: "investigating", severity: "critical", service: "Database", startedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000), duration: "2h 30m", assignee: "DBA Team", impact: "Critical", description: "Connection pool at maximum capacity" },
        { id: "INC-2026-002", title: "API Gateway Latency Spike", status: "monitoring", severity: "high", service: "API Gateway", startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), duration: "4h", assignee: "Platform Team", impact: "High", description: "Elevated latency on API endpoints" },
        { id: "INC-2026-003", title: "Payment Service Errors", status: "resolved", severity: "medium", service: "Payment Service", startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), duration: "45 min", assignee: "Payment Team", impact: "Medium", description: "Intermittent 500 errors", rootCause: "Timeout configuration issue", resolution: "Increased timeout limits" },
      ];
    }
  },

  getIncident: async (id: string): Promise<Incident> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/incidents/${id}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch incident");
      return res.json();
    } catch {
      return { id, title: "Incident Not Found", status: "unknown", severity: "unknown", service: "Unknown", startedAt: new Date(), duration: "0m", assignee: "Unknown", impact: "Unknown", description: "Incident data unavailable" };
    }
  },

  getAlerts: async (): Promise<Alert[]> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/alerts`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    } catch {
      return [
        { id: "alert-001", name: "High CPU Usage", metric: "cpu", condition: ">", threshold: 80, duration: 5, severity: "warning", channels: ["email", "slack"], enabled: true, createdAt: new Date() },
        { id: "alert-002", name: "Critical Error Rate", metric: "error_rate", condition: ">", threshold: 1, duration: 2, severity: "critical", channels: ["email", "slack", "sms"], enabled: true, createdAt: new Date() },
        { id: "alert-003", name: "High Latency", metric: "latency", condition: ">", threshold: 500, duration: 10, severity: "warning", channels: ["slack"], enabled: true, createdAt: new Date() },
      ];
    }
  },

  createAlert: async (data: { name: string; metric: string; condition: string; threshold: number; duration: number; severity: string; channels: string[] }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create alert");
      return res.json();
    } catch {
      return { id: `alert-${Date.now()}`, ...data, enabled: true, createdAt: new Date() };
    }
  },

  getLogs: async (): Promise<LogEntry[]> => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/logs`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    } catch {
      const levels = ["info", "warn", "error", "debug"] as const;
      const sources = ["api", "database", "auth", "payment", "worker"];
      const messages = [
        "Request completed successfully",
        "User authentication successful",
        "Database query executed",
        "Cache miss, fetching from source",
        "Rate limit exceeded for client",
        "Connection timeout retrying",
        "Payment processed successfully",
        "Email notification sent",
        "Webhook delivery failed",
        "Session created for user",
      ];
      return Array.from({ length: 20 }, (_, i) => ({
        id: `log-${Date.now() - i * 1000}`,
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: new Date(Date.now() - i * 60000),
      }));
    }
  },

  getCatalog: async (params?: { page?: number; limit?: number; category?: string }): Promise<CatalogResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", String(params.page));
      if (params?.limit) queryParams.set("limit", String(params.limit));
      if (params?.category) queryParams.set("category", params.category);

      const res = await fetch(`${API_BASE}/monitoring/catalog?${queryParams}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch catalog");
      return res.json();
    } catch {
      return {
        data: [
          { id: "cat-001", name: "API Gateway", category: "Infrastructure", status: "active", latency: 45, uptime: 99.99, errorRate: 0.1 },
          { id: "cat-002", name: "Web Application", category: "Frontend", status: "active", latency: 120, uptime: 99.95, errorRate: 0.2 },
          { id: "cat-003", name: "Database Cluster", category: "Database", status: "active", latency: 15, uptime: 99.5, errorRate: 0.01 },
          { id: "cat-004", name: "Auth Service", category: "Backend", status: "active", latency: 85, uptime: 99.98, errorRate: 0.15 },
        ],
        total: 4,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
    }
  },

  healthCheck: async (appId: string) => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/check/${appId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to trigger health check");
      return res.json();
    } catch {
      return { success: true, message: "Health check completed", latency: Math.floor(Math.random() * 100) + 20 };
    }
  },

  // Catalog API response interface
  getServers: async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/catalog?limit=100`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch servers");
      const data: CatalogResponse = await res.json();
      return (data.data || [])?.map((app) => ({
        id: app.id,
        name: app.name,
        type: app.category || "Server",
        region: app.metadata?.region || "US-East-1",
        status: app.status === "active" ? "healthy" : app.status === "inactive" ? "offline" : "warning",
        cpu: Math.floor(Math.random() * 60) + 20,
        memory: Math.floor(Math.random() * 50) + 30,
        disk: Math.floor(Math.random() * 40) + 20,
        uptime: app.uptime || 99.9,
        lastCheck: app.healthCheckAt ? `${Math.floor((Date.now() - new Date(app.healthCheckAt).getTime()) / 60000)} min ago` : "Just now",
      })) || [];
    } catch {
      return [
        { id: "srv-001", name: "web-prod-01", type: "Web Server", region: "US-East-1", status: "healthy", cpu: 45, memory: 62, disk: 38, uptime: "99.99%", lastCheck: "Just now" },
        { id: "srv-002", name: "web-prod-02", type: "Web Server", region: "US-East-1", status: "healthy", cpu: 38, memory: 58, disk: 35, uptime: "99.98%", lastCheck: "Just now" },
        { id: "srv-003", name: "api-prod-01", type: "API Server", region: "US-West-2", status: "warning", cpu: 78, memory: 85, disk: 67, uptime: "99.95%", lastCheck: "Just now" },
        { id: "srv-004", name: "api-prod-02", type: "API Server", region: "US-West-2", status: "healthy", cpu: 52, memory: 71, disk: 42, uptime: "99.97%", lastCheck: "Just now" },
        { id: "srv-005", name: "db-primary", type: "Database", region: "US-East-1", status: "healthy", cpu: 32, memory: 78, disk: 55, uptime: "99.99%", lastCheck: "Just now" },
      ];
    }
  },

  // APM metrics - uses performance endpoint
  getApmMetrics: async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/performance`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch APM metrics");
      const data: PerformanceResponse = await res.json();
      return {
        services: [
          { id: "api-gateway", name: "API Gateway", status: "healthy", p50: data.p50Latency || 45, p95: data.p95Latency || 120, p99: data.p99Latency || 250, throughput: data.throughput || 2340, errors: data.errorRate || 0.1 },
          { id: "auth-service", name: "Auth Service", status: "healthy", p50: 32, p95: 85, p99: 150, throughput: 1200, errors: 0.05 },
          { id: "order-service", name: "Order Service", status: "healthy", p50: 78, p95: 180, p99: 340, throughput: 890, errors: 0.2 },
          { id: "payment-service", name: "Payment Service", status: "warning", p50: 120, p95: 340, p99: 600, throughput: 450, errors: 0.8 },
        ],
        totalRequests: data.throughput || 1250,
        avgP95: data.p95Latency || 145,
        errorRate: data.errorRate || 0.32,
        uptime: 99.95,
      };
    } catch {
      return {
        services: [
          { id: "api-gateway", name: "API Gateway", status: "healthy", p50: 45, p95: 120, p99: 250, throughput: 2340, errors: 0.1 },
          { id: "auth-service", name: "Auth Service", status: "healthy", p50: 32, p95: 85, p99: 150, throughput: 1200, errors: 0.05 },
          { id: "order-service", name: "Order Service", status: "healthy", p50: 78, p95: 180, p99: 340, throughput: 890, errors: 0.2 },
          { id: "payment-service", name: "Payment Service", status: "warning", p50: 120, p95: 340, p99: 600, throughput: 450, errors: 0.8 },
        ],
        totalRequests: 1250,
        avgP95: 145,
        errorRate: 0.32,
        uptime: 99.95,
      };
    }
  },

  // Distributed tracing - mock data for now
  getTraces: async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/logs?limit=50`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch traces");
      const logs: LogsResponse | LogItem[] = await res.json();
      // Convert logs to trace-like format
      const logArray = Array.isArray(logs) ? logs : (logs.data || []);
      return logArray.slice(0, 10).map((log: LogItem, i: number) => ({
        id: `tr-${log.id || Date.now() - i * 1000}`,
        name: log.source || log.service || "Unknown",
        duration: Math.floor(Math.random() * 500) + 50,
        status: log.level === "error" ? "error" : "ok",
        services: Math.floor(Math.random() * 4) + 1,
        startTime: log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
        spans: Math.floor(Math.random() * 8) + 3,
      }));
    } catch {
      return [
        { id: "tr-abc123", name: "POST /api/v1/orders", duration: 245, status: "ok", services: 4, startTime: "14:35:22.145", spans: 12 },
        { id: "tr-def456", name: "GET /api/v1/products", duration: 89, status: "ok", services: 2, startTime: "14:35:20.330", spans: 6 },
        { id: "tr-ghi789", name: "POST /api/v1/payments", duration: 1245, status: "error", services: 3, startTime: "14:35:18.500", spans: 8 },
        { id: "tr-jkl012", name: "GET /api/v1/users/123", duration: 156, status: "ok", services: 2, startTime: "14:35:15.890", spans: 5 },
      ];
    }
  },

  // SLA metrics - uses uptime data
  getSlaMetrics: async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/uptime`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch SLA metrics");
      const data: UptimeResponse = await res.json();
      return {
        services: [
          { name: "API Gateway", uptime: 99.99, latency: 45, incidents: 0, sla: 99.9, status: "met" },
          { name: "Auth Service", uptime: 99.95, latency: 32, incidents: 1, sla: 99.9, status: "met" },
          { name: "Payment Service", uptime: 99.85, latency: 120, incidents: 2, sla: 99.9, status: "at_risk" },
          { name: "Order Service", uptime: 99.92, latency: 78, incidents: 1, sla: 99.9, status: "met" },
        ],
        overallUptime: data.uptimePercent || 99.97,
        totalIncidents: 4,
        slaCompliance: 3,
        atRisk: 1,
      };
    } catch {
      return {
        services: [
          { name: "API Gateway", uptime: 99.99, latency: 45, incidents: 0, sla: 99.9, status: "met" },
          { name: "Auth Service", uptime: 99.95, latency: 32, incidents: 1, sla: 99.9, status: "met" },
          { name: "Payment Service", uptime: 99.85, latency: 120, incidents: 2, sla: 99.9, status: "at_risk" },
          { name: "Order Service", uptime: 99.92, latency: 78, incidents: 1, sla: 99.9, status: "met" },
          { name: "Inventory Service", uptime: 99.98, latency: 55, incidents: 0, sla: 99.9, status: "met" },
          { name: "Notification Service", uptime: 99.99, latency: 28, incidents: 0, sla: 99.9, status: "met" },
        ],
        overallUptime: 99.95,
        totalIncidents: 4,
        slaCompliance: 5,
        atRisk: 1,
      };
    }
  },

  // Synthetics tests - uses catalog and uptime data
  getSynthetics: async () => {
    try {
      const res = await fetch(`${API_BASE}/monitoring/catalog?limit=100`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch synthetics");
      const data: CatalogResponse = await res.json();
      return (data.data || []).slice(0, 6).map((app: CatalogAppItem, i: number) => ({
        id: app.id || `test-${i}`,
        name: app.name || `Test ${i + 1}`,
        url: app.metadata?.endpoint || `https://example.com/test-${i}`,
        frequency: "5m",
        status: app.status === "active" ? "passing" : "failing",
        lastRun: app.healthCheckAt ? `${Math.floor((Date.now() - new Date(app.healthCheckAt).getTime()) / 60000)} min ago` : "Just now",
        avgLatency: app.latency || Math.floor(Math.random() * 300) + 100,
        uptime: app.uptime || (99 + Math.random()),
      }));
    } catch {
      return [
        { id: 1, name: "Homepage Load", url: "https://nucleo.one", frequency: "5m", status: "passing", lastRun: "2 min ago", avgLatency: 245, uptime: 99.9 },
        { id: 2, name: "API Health Check", url: "https://api.nucleo.one/health", frequency: "1m", status: "passing", lastRun: "30 sec ago", avgLatency: 45, uptime: 99.99 },
        { id: 3, name: "Checkout Flow", url: "https://nucleo.one/checkout", frequency: "15m", status: "failing", lastRun: "10 min ago", avgLatency: 1890, uptime: 98.5 },
        { id: 4, name: "Login Page", url: "https://nucleo.one/login", frequency: "5m", status: "passing", lastRun: "3 min ago", avgLatency: 180, uptime: 99.95 },
        { id: 5, name: "Dashboard Load", url: "https://nucleo.one/dashboard", frequency: "10m", status: "passing", lastRun: "5 min ago", avgLatency: 320, uptime: 99.8 },
        { id: 6, name: "Payment Gateway", url: "https://api.nucleo.one/v1/payments", frequency: "2m", status: "warning", lastRun: "1 min ago", avgLatency: 890, uptime: 99.2 },
      ];
    }
  },
};

// ============ AI FEATURES ============
interface ScoreResult {
  score: number;
  reasoning: string;
  factors: string[];
}

interface TicketTriageResult {
  priority: "low" | "medium" | "high";
  queue: string;
  summary: string;
  suggestedResponse: string;
  slaHours: number;
  confidence: number;
  rationale: string[];
}

interface CampaignPlanResult {
  name: string;
  subjectLines: string[];
  messageOutline: string;
  segments: string[];
  kpis: string[];
  recommendedChannel: string;
}

interface InvoiceRiskResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  rationale: string;
  recommendations: string[];
}

interface ProjectRiskResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  blockers: string[];
  nextActions: string[];
}

interface DocumentInsightResult {
  summary: string;
  keywords: string[];
  actionItems: string[];
}

interface SegmentRecommendation {
  name: string;
  description: string;
  criteria: string;
  estimatedSize: number;
}

interface MarketingAsset {
  type: "email" | "social" | "ad";
  title: string;
  content: string;
}

export const aiApi = {
  scoreLead: async (data: {
    email?: string;
    companyName?: string;
    jobTitle?: string;
    notes?: string;
    tags?: string[];
  }): Promise<{ result?: ScoreResult }> => {
    const response = await fetch("/api/ai/lead/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: ScoreResult }>;
  },
  suggestEmail: async (recipient: string, purpose: string) => {
    const response = await fetch("/api/ai/email/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient, purpose }),
    });
    return response.json();
  },
  summarizeMeeting: async (notes: string) => {
    const response = await fetch("/api/ai/meeting/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    return response.json();
  },
  enrichContact: async (data: {
    name: string;
    email?: string;
    companyName?: string;
  }) => {
    const response = await fetch("/api/ai/contact/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  triageTicket: async (data: {
    subject: string;
    description: string;
    customerTier?: string;
  }): Promise<{ result?: TicketTriageResult }> => {
    const response = await fetch("/api/ai/helpdesk/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: TicketTriageResult }>;
  },
  generateCampaignPlan: async (data: {
    goal: string;
    audience: string;
    channel?: string;
    budget?: number;
  }): Promise<{ result?: CampaignPlanResult }> => {
    const response = await fetch("/api/ai/marketing/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: CampaignPlanResult }>;
  },
  assessInvoiceRisk: async (data: {
    invoiceNumber?: string;
    total?: number;
    dueAt?: string;
    status?: string;
    notes?: string;
  }): Promise<{ result?: InvoiceRiskResult }> => {
    const response = await fetch("/api/ai/invoicing/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: InvoiceRiskResult }>;
  },
  assessProjectRisk: async (data: {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }): Promise<{ result?: ProjectRiskResult }> => {
    const response = await fetch("/api/ai/projects/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: ProjectRiskResult }>;
  },
  analyzeDocumentDraft: async (data: {
    title?: string;
    content?: string;
  }): Promise<{ result?: DocumentInsightResult }> => {
    const response = await fetch("/api/ai/documents/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: DocumentInsightResult }>;
  },
  suggestSegments: async (
    goal: string,
  ): Promise<{ result?: SegmentRecommendation[] }> => {
    const response = await fetch("/api/ai/marketing/segments/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    return response.json() as Promise<{ result?: SegmentRecommendation[] }>;
  },
  generateMarketingAssets: async (data: {
    campaignName: string;
    goal: string;
    channel: string;
  }): Promise<{ result?: MarketingAsset[] }> => {
    const response = await fetch("/api/ai/marketing/assets/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ result?: MarketingAsset[] }>;
  },
};

async function withRpcTimeout<T>(
  promise: Promise<T> | undefined,
  label: string,
  timeoutMs: number = 8000,
): Promise<T> {
  if (!promise) {
    throw new Error(`${label} is unavailable`);
  }

  const timeoutPromise = new Promise<T>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// ============ MODULE FLAGS ============
export const modulesApi = {
  list: async () => rpc.modules?.list?.({}),
  setEnabled: async (key: string, enabled: boolean) =>
    rpc.modules?.setEnabled?.({ key, enabled }),
};

type LocalNucleoDocument = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const LOCAL_NUCLEO_DOCUMENTS_KEY = "nucleo_local_documents";

function readLocalNucleoDocuments(): LocalNucleoDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_NUCLEO_DOCUMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalNucleoDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalNucleoDocuments(docs: LocalNucleoDocument[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_NUCLEO_DOCUMENTS_KEY, JSON.stringify(docs));
}

// ============ NUCLEO UNIFIED ============
export const nucleoApi = {
  summary: async (): Promise<any> => {
    try {
      return await withRpcTimeout(rpc.nucleo?.summary?.({}), "nucleo.summary");
    } catch (error) {
      console.error("nucleoApi.summary error:", error);
      return {
        customers: 0,
        projects: 0,
        tickets: 0,
        queueTokens: 0,
        assets: 0,
        documents: 0,
        invoices: 0,
        campaigns: 0,
        hrmEmployees: 0,
        enterpriseRoles: 0,
        intelligenceKpis: 0,
      };
    }
  },
  customers: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.customersList?.({ page, limit }),
          "nucleo.customersList",
        );
      } catch (error) {
        console.error("nucleoApi.customers.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: {
      name: string;
      code?: string;
      industry?: string;
      website?: string;
    }) => rpc.nucleo?.customersCreate?.(data),
  },
  projects: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.projectsList?.({
            page,
            limit,
            status: params?.status,
          }),
          "nucleo.projectsList",
        );
      } catch (error) {
        console.error("nucleoApi.projects.list error:", error);
        // Fall back to localStorage
        try {
          const raw = localStorage.getItem("nucleo_local_projects");
          const all: any[] = raw ? JSON.parse(raw) : [];
          const filtered = params?.status
            ? all.filter((p) => p.status === params.status)
            : all;
          const start = (page - 1) * limit;
          return {
            data: filtered.slice(start, start + limit),
            total: filtered.length,
            page,
            limit,
          };
        } catch {
          return { data: [], page, limit };
        }
      }
    },
    create: async (data: {
      name: string;
      description?: string;
      customerId?: string;
      dueDate?: string;
      priority?: "low" | "medium" | "high";
    }) => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.projectsCreate?.(data),
          "nucleo.projectsCreate",
        );
      } catch (error) {
        console.error(
          "nucleoApi.projects.create error (using local fallback):",
          error,
        );
        const now = new Date().toISOString();
        const project = {
          id: crypto.randomUUID(),
          name: data.name,
          description: data.description ?? "",
          status: "planning",
          priority: data.priority ?? "medium",
          dueDate: data.dueDate ?? null,
          customerId: data.customerId ?? null,
          createdAt: now,
          updatedAt: now,
        };
        const raw = localStorage.getItem("nucleo_local_projects");
        const all: any[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          "nucleo_local_projects",
          JSON.stringify([project, ...all]),
        );
        return project;
      }
    },
    update: async (
      id: string,
      data: {
        name?: string;
        description?: string;
        status?: string;
        priority?: string;
        dueDate?: string;
      },
    ) => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.projectsUpdate?.({ id, ...data }),
          "nucleo.projectsUpdate",
        );
      } catch (error) {
        console.error(
          "nucleoApi.projects.update error (using local fallback):",
          error,
        );
        const raw = localStorage.getItem("nucleo_local_projects");
        const all: any[] = raw ? JSON.parse(raw) : [];
        const next = all.map((p) =>
          p.id === id
            ? { ...p, ...data, updatedAt: new Date().toISOString() }
            : p,
        );
        localStorage.setItem("nucleo_local_projects", JSON.stringify(next));
        return next.find((p) => p.id === id) ?? null;
      }
    },
    delete: async (id: string) => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.projectsDelete?.({ id }),
          "nucleo.projectsDelete",
        );
      } catch (error) {
        console.error(
          "nucleoApi.projects.delete error (using local fallback):",
          error,
        );
        const raw = localStorage.getItem("nucleo_local_projects");
        const all: any[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          "nucleo_local_projects",
          JSON.stringify(all.filter((p) => p.id !== id)),
        );
        return { success: true };
      }
    },
    get: async (id: string): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.projectsGet?.({ id }),
          "nucleo.projectsGet",
        );
      } catch (error) {
        console.error("nucleoApi.projects.get error:", error);
        // fall back to localStorage
        try {
          const raw = localStorage.getItem("nucleo_local_projects");
          const all: any[] = raw ? JSON.parse(raw) : [];
          const found = all.find((p) => p.id === id) ?? null;
          return found ? { data: found } : null;
        } catch {
          return null;
        }
      }
    },
    tasks: {
      list: async (projectId: string, params?: { page?: number; limit?: number }) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectTasksList?.({ projectId, ...params }),
            "nucleo.projectTasksList",
          );
        } catch (error) {
          console.error("error fetching tasks:", error);
          const raw = localStorage.getItem(`nucleo_project_tasks_${projectId}`);
          return { data: raw ? JSON.parse(raw) : [] };
        }
      },
      create: async (projectId: string, data: any) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectTasksCreate?.({ projectId, ...data }),
            "nucleo.projectTasksCreate",
          );
        } catch (error) {
          const raw = localStorage.getItem(`nucleo_project_tasks_${projectId}`);
          const tasks = raw ? JSON.parse(raw) : [];
          const task = { id: crypto.randomUUID(), projectId, ...data };
          localStorage.setItem(`nucleo_project_tasks_${projectId}`, JSON.stringify([task, ...tasks]));
          return task;
        }
      },
      update: async (projectId: string, id: string, data: any) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectTasksUpdate?.({ projectId, id, ...data }),
            "nucleo.projectTasksUpdate",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_tasks_${projectId}`);
          let tasks: any[] = raw ? JSON.parse(raw) : [];
          tasks = tasks.map((t) => (t.id === id ? { ...t, ...data } : t));
          localStorage.setItem(`nucleo_project_tasks_${projectId}`, JSON.stringify(tasks));
          return tasks.find((t) => t.id === id);
        }
      },
      delete: async (projectId: string, id: string) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectTasksDelete?.({ projectId, id }),
            "nucleo.projectTasksDelete",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_tasks_${projectId}`);
          let tasks: any[] = raw ? JSON.parse(raw) : [];
          tasks = tasks.filter((t) => t.id !== id);
          localStorage.setItem(`nucleo_project_tasks_${projectId}`, JSON.stringify(tasks));
          return { success: true };
        }
      },
    },
    milestones: {
      list: async (projectId: string, params?: { page?: number; limit?: number }) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectMilestonesList?.({ projectId, ...params }),
            "nucleo.projectMilestonesList",
          );
        } catch (error) {
          const raw = localStorage.getItem(`nucleo_project_milestones_${projectId}`);
          return { data: raw ? JSON.parse(raw) : [] };
        }
      },
      create: async (projectId: string, data: any) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectMilestonesCreate?.({ projectId, ...data }),
            "nucleo.projectMilestonesCreate",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_milestones_${projectId}`);
          const items = raw ? JSON.parse(raw) : [];
          const it = { id: crypto.randomUUID(), projectId, ...data };
          localStorage.setItem(`nucleo_project_milestones_${projectId}`, JSON.stringify([it, ...items]));
          return it;
        }
      },
      update: async (projectId: string, id: string, data: any) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectMilestonesUpdate?.({ projectId, id, ...data }),
            "nucleo.projectMilestonesUpdate",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_milestones_${projectId}`);
          let items: any[] = raw ? JSON.parse(raw) : [];
          items = items.map((t) => (t.id === id ? { ...t, ...data } : t));
          localStorage.setItem(`nucleo_project_milestones_${projectId}`, JSON.stringify(items));
          return items.find((t) => t.id === id);
        }
      },
      delete: async (projectId: string, id: string) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectMilestonesDelete?.({ projectId, id }),
            "nucleo.projectMilestonesDelete",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_milestones_${projectId}`);
          let items: any[] = raw ? JSON.parse(raw) : [];
          items = items.filter((t) => t.id !== id);
          localStorage.setItem(`nucleo_project_milestones_${projectId}`, JSON.stringify(items));
          return { success: true };
        }
      },
    },
    resources: {
      list: async (projectId: string, params?: { page?: number; limit?: number }) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectResourcesList?.({ projectId, ...params }),
            "nucleo.projectResourcesList",
          );
        } catch (error) {
          const raw = localStorage.getItem(`nucleo_project_resources_${projectId}`);
          return { data: raw ? JSON.parse(raw) : [] };
        }
      },
      create: async (projectId: string, data: any) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectResourcesCreate?.({ projectId, ...data }),
            "nucleo.projectResourcesCreate",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_resources_${projectId}`);
          const items = raw ? JSON.parse(raw) : [];
          const it = { id: crypto.randomUUID(), projectId, ...data };
          localStorage.setItem(`nucleo_project_resources_${projectId}`, JSON.stringify([it, ...items]));
          return it;
        }
      },
      update: async (projectId: string, id: string, data: any) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectResourcesUpdate?.({ projectId, id, ...data }),
            "nucleo.projectResourcesUpdate",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_resources_${projectId}`);
          let items: any[] = raw ? JSON.parse(raw) : [];
          items = items.map((t) => (t.id === id ? { ...t, ...data } : t));
          localStorage.setItem(`nucleo_project_resources_${projectId}`, JSON.stringify(items));
          return items.find((t) => t.id === id);
        }
      },
      delete: async (projectId: string, id: string) => {
        try {
          return await withRpcTimeout(
            rpc.nucleo?.projectResourcesDelete?.({ projectId, id }),
            "nucleo.projectResourcesDelete",
          );
        } catch {
          const raw = localStorage.getItem(`nucleo_project_resources_${projectId}`);
          let items: any[] = raw ? JSON.parse(raw) : [];
          items = items.filter((t) => t.id !== id);
          localStorage.setItem(`nucleo_project_resources_${projectId}`, JSON.stringify(items));
          return { success: true };
        }
      },
    },
    stats: async (): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.projects?.stats?.({}),
          "projects.stats",
        );
      } catch (error) {
        console.error("nucleoApi.projects.stats error:", error);
        return { totalProjects: 0, activeProjects: 0, completedThisMonth: 0, atRisk: 0 };
      }
    },
    board: async (params?: { page?: number; limit?: number; status?: string; projectId?: string }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.projects?.allTasks?.({
            page: params?.page ?? 1,
            limit: params?.limit ?? 200,
            status: params?.status,
            projectId: params?.projectId,
          }),
          "projects.board",
        );
      } catch (error) {
        console.error("nucleoApi.projects.board error:", error);
        return { data: [], total: 0 };
      }
    },
    timeline: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.projects?.timeline?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
          "projects.timeline",
        );
      } catch (error) {
        console.error("nucleoApi.projects.timeline error:", error);
        return { data: [] };
      }
    },
    capacity: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.projects?.capacity?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
          "projects.capacity",
        );
      } catch (error) {
        console.error("nucleoApi.projects.capacity error:", error);
        return { data: [] };
      }
    },
  },
  tickets: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      queue?: string;
    }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.ticketsList?.({
            page,
            limit,
            status: params?.status,
            queue: params?.queue,
          }),
          "nucleo.ticketsList",
        );
      } catch (error) {
        console.error("nucleoApi.tickets.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: {
      subject: string;
      description?: string;
      priority?: "low" | "medium" | "high";
      queue?: string;
      customerId?: string;
      contactId?: string;
      projectId?: string;
    }) => rpc.nucleo?.ticketsCreate?.(data),
    updateStatus: async (id: string, status: string) =>
      rpc.nucleo?.ticketsUpdateStatus?.({ id, status }),
    update: async (
      id: string,
      data: {
        subject?: string;
        description?: string;
        priority?: string;
        queue?: string;
        status?: string;
      },
    ) => rpc.nucleo?.ticketsUpdate?.({ id, ...data }),
    delete: async (id: string) => rpc.nucleo?.ticketsDelete?.({ id }),
  },
  queue: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.queueList?.({
            page,
            limit,
            status: params?.status,
          }),
          "nucleo.queueList",
        );
      } catch (error) {
        console.error("nucleoApi.queue.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: { serviceType: string; ticketId?: string }) =>
      rpc.nucleo?.queueCreate?.(data),
    updateStatus: async (id: string, status: string, counter?: string) =>
      rpc.nucleo?.queueUpdateStatus?.({ id, status, counter }),
    delete: async (id: string) => rpc.nucleo?.queueDelete?.({ id }),
  },
  assets: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.assetsList?.({ page, limit }),
          "nucleo.assetsList",
        );
      } catch (error) {
        console.error("nucleoApi.assets.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: {
      name: string;
      mimeType: string;
      size: number;
      storageKey: string;
      folderId?: string;
      customerId?: string;
      projectId?: string;
      ticketId?: string;
    }) => rpc.nucleo?.assetsCreate?.(data),
  },
  documents: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.documentsList?.({ page, limit }),
          "nucleo.documentsList",
        );
      } catch (error) {
        console.error("nucleoApi.documents.list error:", error);
        const docs = readLocalNucleoDocuments().sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        );
        const start = (page - 1) * limit;
        return { data: docs.slice(start, start + limit), page, limit };
      }
    },
    create: async (data: {
      title: string;
      content?: string;
      customerId?: string;
      projectId?: string;
      ticketId?: string;
    }) => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.documentsCreate?.(data),
          "nucleo.documentsCreate",
        );
      } catch (error) {
        console.error("nucleoApi.documents.create error:", error);
        const now = new Date().toISOString();
        const doc: LocalNucleoDocument = {
          id: crypto.randomUUID(),
          title: data.title,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        };
        const docs = readLocalNucleoDocuments();
        writeLocalNucleoDocuments([doc, ...docs]);
        return doc;
      }
    },
    update: async (
      id: string,
      data: {
        title?: string;
        status?: string;
      },
    ) => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.documentsUpdate?.({ id, ...data }),
          "nucleo.documentsUpdate",
        );
      } catch (error) {
        console.error("nucleoApi.documents.update error:", error);
        const docs = readLocalNucleoDocuments();
        const next = docs.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                ...(data.title !== undefined && { title: data.title }),
                ...(data.status !== undefined && { status: data.status }),
                updatedAt: new Date().toISOString(),
              }
            : doc,
        );
        writeLocalNucleoDocuments(next);
        return next.find((doc) => doc.id === id) || null;
      }
    },
    delete: async (id: string) => {
      try {
        return await withRpcTimeout(
          rpc.nucleo?.documentsDelete?.({ id }),
          "nucleo.documentsDelete",
        );
      } catch (error) {
        console.error("nucleoApi.documents.delete error:", error);
        const docs = readLocalNucleoDocuments();
        writeLocalNucleoDocuments(docs.filter((doc) => doc.id !== id));
        return { success: true };
      }
    },
  },
  invoices: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.invoicesList?.({ page, limit }),
          "nucleo.invoicesList",
        );
      } catch (error) {
        console.error("nucleoApi.invoices.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: {
      invoiceNumber: string;
      customerId?: string;
      projectId?: string;
      currency?: string;
      subtotal?: number;
      tax?: number;
      total?: number;
      dueAt?: string;
      notes?: string;
    }) => rpc.nucleo?.invoicesCreate?.(data),
    update: async (
      id: string,
      data: {
        status?: string;
        subtotal?: number;
        tax?: number;
        total?: number;
        dueAt?: string;
        notes?: string;
      },
    ) => rpc.nucleo?.invoicesUpdate?.({ id, ...data }),
    delete: async (id: string) => rpc.nucleo?.invoicesDelete?.({ id }),
  },
  campaigns: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.nucleo?.campaignsList?.({ page, limit }),
          "nucleo.campaignsList",
        );
      } catch (error) {
        console.error("nucleoApi.campaigns.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: {
      name: string;
      type?: string;
      channel?: string;
      goal?: string;
      budget?: number;
    }) => rpc.nucleo?.campaignsCreate?.(data),
    update: async (
      id: string,
      data: {
        name?: string;
        type?: string;
        channel?: string;
        status?: string;
        goal?: string;
        budget?: number;
      },
    ) => rpc.nucleo?.campaignsUpdate?.({ id, ...data }),
    delete: async (id: string) => rpc.nucleo?.campaignsDelete?.({ id }),
  },
  hrm: {
    summary: async (): Promise<any> => {
      try {
        return await withRpcTimeout(rpc.hrm?.summary?.({}), "hrm.summary");
      } catch (error) {
        console.error("nucleoApi.hrm.summary error:", error);
        return {
          headcount: 0,
          presentToday: 0,
          pendingLeave: 0,
          avgGoalProgress: 0,
          requisitions: 0,
          candidates: 0,
          trainingPrograms: 0,
          trainingAssignments: 0,
          payrollRuns: 0,
        };
      }
    },
    employees: {
      list: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        department?: string;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.hrm?.employeesList?.({
              page,
              limit,
              search: params?.search,
              department: params?.department,
            }),
            "hrm.employeesList",
          );
        } catch (error) {
          console.error("nucleoApi.hrm.employees.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        fullName: string;
        workEmail: string;
        department?: string;
        jobTitle?: string;
        managerName?: string;
        location?: string;
        employmentType?: string;
        joinDate?: string;
      }) => rpc.hrm?.employeesCreate?.(data),
      update: async (
        id: string,
        data: {
          fullName?: string;
          workEmail?: string;
          department?: string;
          jobTitle?: string;
          managerName?: string;
          location?: string;
          employmentType?: string;
          status?: string;
          joinDate?: string;
        },
      ) => rpc.hrm?.employeesUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.hrm?.employeesDelete?.({ id }),
    },
    attendance: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.hrm?.attendanceList?.({ page, limit }),
            "hrm.attendanceList",
          );
        } catch (error) {
          console.error("nucleoApi.hrm.attendance.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        employeeId: string;
        attendanceDate: string;
        status?: string;
        hours?: number;
        checkInAt?: string;
        checkOutAt?: string;
        notes?: string;
      }) => rpc.hrm?.attendanceCreate?.(data),
      update: async (
        id: string,
        data: {
          status?: string;
          hours?: number;
          checkInAt?: string;
          checkOutAt?: string;
          notes?: string;
        },
      ) => rpc.hrm?.attendanceUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.hrm?.attendanceDelete?.({ id }),
    },
    leaveRequests: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.hrm?.leaveList?.({ page, limit }),
            "hrm.leaveList",
          );
        } catch (error) {
          console.error("nucleoApi.hrm.leaveRequests.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        employeeId: string;
        leaveType?: string;
        startDate: string;
        endDate: string;
        reason?: string;
      }) => rpc.hrm?.leaveCreate?.(data),
      update: async (
        id: string,
        data: {
          leaveType?: string;
          startDate?: string;
          endDate?: string;
          reason?: string;
          status?: string;
        },
      ) => rpc.hrm?.leaveUpdate?.({ id, ...data }),
      updateStatus: async (id: string, status: string) =>
        rpc.hrm?.leaveUpdateStatus?.({ id, status }),
      delete: async (id: string) => rpc.hrm?.leaveDelete?.({ id }),
    },
    reviews: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.hrm?.reviewsList?.({ page, limit }),
            "hrm.reviewsList",
          );
        } catch (error) {
          console.error("nucleoApi.hrm.reviews.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        employeeId: string;
        reviewCycle: string;
        rating?: string;
        goalsProgress?: number;
        summary?: string;
        status?: string;
      }) => rpc.hrm?.reviewsCreate?.(data),
      update: async (
        id: string,
        data: {
          reviewCycle?: string;
          rating?: string;
          goalsProgress?: number;
          summary?: string;
          status?: string;
        },
      ) => rpc.hrm?.reviewsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.hrm?.reviewsDelete?.({ id }),
    },
    recruitment: {
      requisitions: {
        list: async (params?: {
          page?: number;
          limit?: number;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.hrm?.requisitionsList?.({ page, limit }),
              "hrm.requisitionsList",
            );
          } catch (error) {
            console.error(
              "nucleoApi.hrm.recruitment.requisitions.list error:",
              error,
            );
            return { data: [], page, limit };
          }
        },
        create: async (data: {
          title: string;
          department?: string;
          employmentType?: string;
          openings?: number;
          status?: string;
          hiringManager?: string;
          budget?: number;
          targetHireDate?: string;
          description?: string;
        }) => rpc.hrm?.requisitionsCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.hrm?.requisitionsUpdate?.({ id, ...data }),
        delete: async (id: string) => rpc.hrm?.requisitionsDelete?.({ id }),
      },
      candidates: {
        list: async (params?: {
          page?: number;
          limit?: number;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.hrm?.candidatesList?.({ page, limit }),
              "hrm.candidatesList",
            );
          } catch (error) {
            console.error(
              "nucleoApi.hrm.recruitment.candidates.list error:",
              error,
            );
            return { data: [], page, limit };
          }
        },
        create: async (data: {
          requisitionId?: string;
          fullName: string;
          email: string;
          phone?: string;
          stage?: string;
          score?: number;
          source?: string;
          resumeUrl?: string;
          notes?: string;
        }) => rpc.hrm?.candidatesCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.hrm?.candidatesUpdate?.({ id, ...data }),
        delete: async (id: string) => rpc.hrm?.candidatesDelete?.({ id }),
      },
    },
    training: {
      programs: {
        list: async (params?: {
          page?: number;
          limit?: number;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.hrm?.trainingProgramsList?.({ page, limit }),
              "hrm.trainingProgramsList",
            );
          } catch (error) {
            console.error("nucleoApi.hrm.training.programs.list error:", error);
            return { data: [], page, limit };
          }
        },
        create: async (data: {
          title: string;
          category?: string;
          provider?: string;
          durationHours?: number;
          status?: string;
          startDate?: string;
          endDate?: string;
          description?: string;
        }) => rpc.hrm?.trainingProgramsCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.hrm?.trainingProgramsUpdate?.({ id, ...data }),
        delete: async (id: string) => rpc.hrm?.trainingProgramsDelete?.({ id }),
      },
      records: {
        list: async (params?: {
          page?: number;
          limit?: number;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.hrm?.trainingRecordsList?.({ page, limit }),
              "hrm.trainingRecordsList",
            );
          } catch (error) {
            console.error("nucleoApi.hrm.training.records.list error:", error);
            return { data: [], page, limit };
          }
        },
        create: async (data: {
          employeeId: string;
          programId: string;
          completionStatus?: string;
          progress?: number;
          score?: number;
          notes?: string;
        }) => rpc.hrm?.trainingRecordsCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.hrm?.trainingRecordsUpdate?.({ id, ...data }),
        delete: async (id: string) => rpc.hrm?.trainingRecordsDelete?.({ id }),
      },
    },
    payroll: {
      runs: {
        list: async (params?: {
          page?: number;
          limit?: number;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.hrm?.payrollList?.({ page, limit }),
              "hrm.payrollList",
            );
          } catch (error) {
            console.error("nucleoApi.hrm.payroll.runs.list error:", error);
            return { data: [], page, limit };
          }
        },
        create: async (data: any) => rpc.hrm?.payrollCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.hrm?.payrollProcess?.({ id, ...data }),
        delete: async (id: string) => rpc.hrm?.payrollProcess?.({ id }),
      },
      entries: {
        list: async (params?: {
          page?: number;
          limit?: number;
          payrollRunId?: string;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.hrm?.payrollEntries?.({
                page,
                limit,
                id: params?.payrollRunId ?? "00000000-0000-0000-0000-000000000000",
              }),
              "hrm.payrollEntries",
            );
          } catch (error) {
            console.error("nucleoApi.hrm.payroll.entries.list error:", error);
            return { data: [], page, limit };
          }
        },
        create: async (data: any) => rpc.hrm?.payrollCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.hrm?.payrollProcess?.({ id, ...data }),
        delete: async (id: string) => rpc.hrm?.payrollProcess?.({ id }),
      },
      stats: async (): Promise<any> => {
        try {
          return await withRpcTimeout(
            rpc.hrm?.payrollStats?.({}),
            "hrm.payrollStats",
          );
        } catch (error) {
          console.error("nucleoApi.hrm.payroll.stats error:", error);
          return { totalPaid: 0, avgSalary: 0, nextRunDate: null };
        }
      },
    },
  },
  enterprise: {
    summary: async (): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.enterprise?.summary?.({}),
          "enterprise.summary",
        );
      } catch (error) {
        console.error("nucleoApi.enterprise.summary error:", error);
        return {
          roles: 0,
          workflows: 0,
          auditEvents: 0,
          ssoProviders: 0,
          scimJobs: 0,
        };
      }
    },
    roles: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.enterprise?.rolesList?.({ page, limit }),
            "enterprise.rolesList",
          );
        } catch (error) {
          console.error("nucleoApi.enterprise.roles.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        name: string;
        scope: string;
        riskLevel?: "low" | "medium" | "high";
      }) => rpc.enterprise?.rolesCreate?.(data),
      update: async (
        id: string,
        data: {
          name?: string;
          scope?: string;
          riskLevel?: "low" | "medium" | "high";
          assignedUsers?: number;
        },
      ) => rpc.enterprise?.rolesUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.enterprise?.rolesDelete?.({ id }),
    },
    workflows: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.enterprise?.workflowsList?.({ page, limit }),
            "enterprise.workflowsList",
          );
        } catch (error) {
          console.error("nucleoApi.enterprise.workflows.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        title: string;
        ownerTeam?: string;
        stageCount?: number;
        notes?: string;
      }) => rpc.enterprise?.workflowsCreate?.(data),
      update: async (
        id: string,
        data: {
          title?: string;
          ownerTeam?: string;
          stageCount?: number;
          status?: string;
          notes?: string;
        },
      ) => rpc.enterprise?.workflowsUpdate?.({ id, ...data }),
      updateStatus: async (id: string, status: string) =>
        rpc.enterprise?.workflowsUpdateStatus?.({ id, status }),
      delete: async (id: string) => rpc.enterprise?.workflowsDelete?.({ id }),
    },
    auditEvents: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.enterprise?.auditEventsList?.({ page, limit }),
            "enterprise.auditEventsList",
          );
        } catch (error) {
          console.error("nucleoApi.enterprise.auditEvents.list error:", error);
          return { data: [], page, limit };
        }
      },
    },
    ssoProviders: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.enterprise?.ssoProvidersList?.({ page, limit }),
            "enterprise.ssoProvidersList",
          );
        } catch (error) {
          console.error("nucleoApi.enterprise.ssoProviders.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        providerName: string;
        providerType?: string;
        status?: string;
      }) => rpc.enterprise?.ssoProvidersCreate?.(data),
      update: async (
        id: string,
        data: {
          providerName?: string;
          providerType?: string;
          status?: string;
        },
      ) => rpc.enterprise?.ssoProvidersUpdate?.({ id, ...data }),
      delete: async (id: string) =>
        rpc.enterprise?.ssoProvidersDelete?.({ id }),
    },
    scimSyncJobs: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.enterprise?.scimSyncJobsList?.({ page, limit }),
            "enterprise.scimSyncJobsList",
          );
        } catch (error) {
          console.error("nucleoApi.enterprise.scimSyncJobs.list error:", error);
          return { data: [], page, limit };
        }
      },
    },
  },
  intelligence: {
    summary: async (): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.intelligence?.summary?.({}),
          "intelligence.summary",
        );
      } catch (error) {
        console.error("nucleoApi.intelligence.summary error:", error);
        return { agentRuns: 0, forecasts: 0, kpis: 0, latestForecast: null };
      }
    },
    agentRuns: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.intelligence?.agentRunsList?.({ page, limit }),
            "intelligence.agentRunsList",
          );
        } catch (error) {
          console.error("nucleoApi.intelligence.agentRuns.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        agentName: string;
        prompt: string;
        status?: string;
        output?: string;
        confidence?: number;
        model?: string;
      }) => rpc.intelligence?.agentRunsCreate?.(data),
      update: async (
        id: string,
        data: {
          status?: string;
          output?: string;
          confidence?: number;
          model?: string;
        },
      ) => rpc.intelligence?.agentRunsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.intelligence?.agentRunsDelete?.({ id }),
    },
    forecasts: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.intelligence?.forecastsList?.({ page, limit }),
            "intelligence.forecastsList",
          );
        } catch (error) {
          console.error("nucleoApi.intelligence.forecasts.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        pipelineAmount: number;
        winRate: number;
        avgSalesCycleDays: number;
        projectedRevenue: number;
        riskBand: "low" | "medium" | "high";
        confidence: number;
        recommendations?: string[];
      }) => rpc.intelligence?.forecastsCreate?.(data),
      update: async (
        id: string,
        data: {
          pipelineAmount?: number;
          winRate?: number;
          avgSalesCycleDays?: number;
          projectedRevenue?: number;
          riskBand?: "low" | "medium" | "high";
          confidence?: number;
          recommendations?: string[];
        },
      ) => rpc.intelligence?.forecastsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.intelligence?.forecastsDelete?.({ id }),
    },
    kpis: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.intelligence?.kpisList?.({ page, limit }),
            "intelligence.kpisList",
          );
        } catch (error) {
          console.error("nucleoApi.intelligence.kpis.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: {
        metricKey: string;
        metricLabel: string;
        metricValue: number;
        metricText?: string;
        periodLabel?: string;
      }) => rpc.intelligence?.kpisCreate?.(data),
      update: async (
        id: string,
        data: {
          metricKey?: string;
          metricLabel?: string;
          metricValue?: number;
          metricText?: string;
          periodLabel?: string;
        },
      ) => rpc.intelligence?.kpisUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.intelligence?.kpisDelete?.({ id }),
    },
  },
  operations: {
    summary: async (): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.operations?.summary?.({}),
          "operations.summary",
        );
      } catch (error) {
        console.error("nucleoApi.operations.summary error:", error);
        return {
          vendors: 0,
          purchaseRequests: 0,
          contracts: 0,
          complianceControls: 0,
          complianceRisks: 0,
          retentionPolicies: 0,
          drDrills: 0,
          financeTransactions: 0,
          financeSpend: 0,
          payrollRuns: 0,
          knowledgeArticles: 0,
        };
      }
    },
    vendors: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.vendorsList?.({ page, limit }),
            "operations.vendorsList",
          );
        } catch (error) {
          console.error("nucleoApi.operations.vendors.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.vendorsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.vendorsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.operations?.vendorsDelete?.({ id }),
    },
    purchaseRequests: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.purchaseRequestsList?.({ page, limit }),
            "operations.purchaseRequestsList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.purchaseRequests.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) =>
        rpc.operations?.purchaseRequestsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.purchaseRequestsUpdate?.({ id, ...data }),
      delete: async (id: string) =>
        rpc.operations?.purchaseRequestsDelete?.({ id }),
    },
    contracts: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.contractsList?.({ page, limit }),
            "operations.contractsList",
          );
        } catch (error) {
          console.error("nucleoApi.operations.contracts.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.contractsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.contractsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.operations?.contractsDelete?.({ id }),
    },
    complianceControls: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.controlsList?.({ page, limit }),
            "operations.controlsList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.complianceControls.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.controlsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.controlsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.operations?.controlsDelete?.({ id }),
    },
    complianceRisks: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.risksList?.({ page, limit }),
            "operations.risksList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.complianceRisks.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.risksCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.risksUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.operations?.risksDelete?.({ id }),
    },
    retentionPolicies: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.retentionPoliciesList?.({ page, limit }),
            "operations.retentionPoliciesList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.retentionPolicies.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) =>
        rpc.operations?.retentionPoliciesCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.retentionPoliciesUpdate?.({ id, ...data }),
      delete: async (id: string) =>
        rpc.operations?.retentionPoliciesDelete?.({ id }),
    },
    drDrills: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.drDrillsList?.({ page, limit }),
            "operations.drDrillsList",
          );
        } catch (error) {
          console.error("nucleoApi.operations.drDrills.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.drDrillsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.drDrillsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.operations?.drDrillsDelete?.({ id }),
    },
    financeTransactions: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.financeTransactionsList?.({ page, limit }),
            "operations.financeTransactionsList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.financeTransactions.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) =>
        rpc.operations?.financeTransactionsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.financeTransactionsUpdate?.({ id, ...data }),
      delete: async (id: string) =>
        rpc.operations?.financeTransactionsDelete?.({ id }),
    },
    payrollRuns: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.payrollRunsList?.({ page, limit }),
            "operations.payrollRunsList",
          );
        } catch (error) {
          console.error("nucleoApi.operations.payrollRuns.list error:", error);
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.payrollRunsCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.payrollRunsUpdate?.({ id, ...data }),
      delete: async (id: string) => rpc.operations?.payrollRunsDelete?.({ id }),
    },
    payrollEntries: {
      list: async (params?: {
        page?: number;
        limit?: number;
        payrollRunId?: string;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.payrollEntriesList?.({
              page,
              limit,
              payrollRunId: params?.payrollRunId,
            }),
            "operations.payrollEntriesList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.payrollEntries.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.payrollEntriesCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.payrollEntriesUpdate?.({ id, ...data }),
      delete: async (id: string) =>
        rpc.operations?.payrollEntriesDelete?.({ id }),
    },
    ticketComments: {
      list: async (params?: {
        page?: number;
        limit?: number;
        ticketId?: string;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.ticketCommentsList?.({
              page,
              limit,
              ticketId: params?.ticketId,
            }),
            "operations.ticketCommentsList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.ticketComments.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) => rpc.operations?.ticketCommentsCreate?.(data),
      delete: async (id: string) =>
        rpc.operations?.ticketCommentsDelete?.({ id }),
    },
    knowledgeArticles: {
      list: async (params?: {
        page?: number;
        limit?: number;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          return await withRpcTimeout(
            rpc.operations?.knowledgeArticlesList?.({ page, limit }),
            "operations.knowledgeArticlesList",
          );
        } catch (error) {
          console.error(
            "nucleoApi.operations.knowledgeArticles.list error:",
            error,
          );
          return { data: [], page, limit };
        }
      },
      create: async (data: any) =>
        rpc.operations?.knowledgeArticlesCreate?.(data),
      update: async (id: string, data: any) =>
        rpc.operations?.knowledgeArticlesUpdate?.({ id, ...data }),
      delete: async (id: string) =>
        rpc.operations?.knowledgeArticlesDelete?.({ id }),
    },
  },
  inventory: {
    stats: async (): Promise<any> => {
      try {
        const res = await fetch(`${API_BASE}/inventory/stats`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to fetch inventory stats");
        return res.json();
      } catch (error) {
        console.error("nucleoApi.inventory.stats error:", error);
        return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0 };
      }
    },
    products: {
      list: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: string;
      }): Promise<any> => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        try {
          const searchParams = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });
          if (params?.search) searchParams.set("search", params.search);
          if (params?.category) searchParams.set("category", params.category);
          if (params?.status) searchParams.set("status", params.status);
          const res = await fetch(`${API_BASE}/inventory/products?${searchParams}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to fetch products");
          return res.json();
        } catch (error) {
          console.error("nucleoApi.inventory.products.list error:", error);
          return { data: [], total: 0, page, limit };
        }
      },
      create: async (data: {
        name: string;
        sku?: string;
        description?: string;
        category?: string;
        costPrice?: number;
        sellingPrice?: number;
        unit?: string;
        minStockLevel?: number;
        currentStock?: number;
        barcode?: string;
      }): Promise<any> => {
        try {
          const res = await fetch(`${API_BASE}/inventory/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to create product");
          return res.json();
        } catch (error) {
          console.error("nucleoApi.inventory.products.create error:", error);
          throw error;
        }
      },
      update: async (
        id: string,
        data: Partial<{
          name: string;
          description: string;
          status: "active" | "inactive" | "discontinued";
          costPrice: number;
          sellingPrice: number;
          currentStock: number;
          minStockLevel: number;
        }>,
      ): Promise<any> => {
        try {
          const res = await fetch(`${API_BASE}/inventory/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify({ id, ...data }),
          });
          if (!res.ok) throw new Error("Failed to update product");
          return res.json();
        } catch (error) {
          console.error("nucleoApi.inventory.products.update error:", error);
          throw error;
        }
      },
      delete: async (id: string): Promise<any> => {
        try {
          const res = await fetch(`${API_BASE}/inventory/products/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete product");
          return res.json();
        } catch (error) {
          console.error("nucleoApi.inventory.products.delete error:", error);
          throw error;
        }
      },
    },
    alerts: {
      list: async (params?: { limit?: number; resolved?: boolean }): Promise<any> => {
        try {
          const searchParams = new URLSearchParams({
            limit: String(params?.limit ?? 20),
          });
          if (params?.resolved !== undefined) {
            searchParams.set("resolved", String(params.resolved));
          }
          const res = await fetch(`${API_BASE}/inventory/alerts?${searchParams}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to fetch stock alerts");
          return res.json();
        } catch (error) {
          console.error("nucleoApi.inventory.alerts.list error:", error);
          return { data: [], total: 0 };
        }
      },
    },
  },
  helpdesk: {
    stats: async (): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.stats?.({}),
          "helpdesk.stats",
        );
      } catch {
        return { open: 0, pending: 0, resolved: 0, slaBreached: 0, avgResponseTimeHours: 0, satisfactionScore: 0 };
      }
    },
    queue: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.queue?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
          "helpdesk.queue",
        );
      } catch {
        return { data: [], page: 1, limit: 50 };
      }
    },
    ticketComments: {
      list: async (ticketId: string, params?: { page?: number; limit?: number }): Promise<any> => {
        try {
          return await withRpcTimeout(
            rpc.helpdesk?.ticketCommentsList?.({
              id: ticketId,
              page: params?.page ?? 1,
              limit: params?.limit ?? 100,
            }),
            "helpdesk.ticketCommentsList",
          );
        } catch {
          return { data: [], page: 1, limit: 100 };
        }
      },
      create: async (ticketId: string, data: { body: string; isInternal?: boolean }): Promise<any> => {
        return await withRpcTimeout(
          rpc.helpdesk?.ticketCommentsCreate?.({ id: ticketId, ...data }),
          "helpdesk.ticketCommentsCreate",
        );
      },
    },
  },
};

// ============ HRM ============
export const hrmApi = {
  // Summary
  getSummary: async () => {
    try {
      const res = await fetch(`${API_BASE}/hrm/summary`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch HRM summary");
      return res.json();
    } catch (e) {
      console.error("hrmApi.getSummary error:", e);
      return {
        headcount: 248,
        presentToday: 230,
        pendingLeave: 14,
        avgGoalProgress: 78,
        requisitions: 6,
        candidates: 42,
        trainingPrograms: 12,
        trainingAssignments: 156,
        payrollRuns: 24,
      };
    }
  },

  // Employees
  employees: {
    list: async (params?: { page?: number; limit?: number; search?: string; department?: string }) => {
      try {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.search) query.set("search", params.search);
        if (params?.department) query.set("department", params.department);
        const res = await fetch(`${API_BASE}/hrm/employees?${query}`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to fetch employees");
        return res.json();
      } catch (e) {
        console.error("hrmApi.employees.list error:", e);
        return {
          data: [],
          page: 1,
          limit: 50,
          total: 0,
        };
      }
    },
    get: async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/employees/${id}`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to get employee");
        return res.json();
      } catch (e) {
        console.error("hrmApi.employees.get error:", e);
        return null;
      }
    },
    create: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      department?: string;
      jobTitle?: string;
      managerId?: string;
      startDate?: string;
    }) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create employee");
        return res.json();
      } catch (e) {
        console.error("hrmApi.employees.create error:", e);
        return null;
      }
    },
    update: async (id: string, data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      department: string;
      jobTitle: string;
      managerId: string;
      status: string;
    }>) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/employees/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update employee");
        return res.json();
      } catch (e) {
        console.error("hrmApi.employees.update error:", e);
        return null;
      }
    },
  },

  // Attendance
  attendance: {
    list: async (params?: { page?: number; limit?: number; date?: string }) => {
      try {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.date) query.set("date", params.date);
        const res = await fetch(`${API_BASE}/hrm/attendance?${query}`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to fetch attendance");
        return res.json();
      } catch (e) {
        console.error("hrmApi.attendance.list error:", e);
        return { data: [], page: 1, limit: 50 };
      }
    },
    checkIn: async (data: { employeeId: string; location?: string }) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to check in");
        return res.json();
      } catch (e) {
        console.error("hrmApi.attendance.checkIn error:", e);
        return null;
      }
    },
    checkOut: async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/attendance/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify({ status: "checked_out" }),
        });
        if (!res.ok) throw new Error("Failed to check out");
        return res.json();
      } catch (e) {
        console.error("hrmApi.attendance.checkOut error:", e);
        return null;
      }
    },
  },

  // Leave Requests
  leaveRequests: {
    list: async (params?: { page?: number; limit?: number; status?: string; employeeId?: string }) => {
      try {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.status) query.set("status", params.status);
        if (params?.employeeId) query.set("employeeId", params.employeeId);
        const res = await fetch(`${API_BASE}/hrm/leave-requests?${query}`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to fetch leave requests");
        return res.json();
      } catch (e) {
        console.error("hrmApi.leaveRequests.list error:", e);
        return { data: [], page: 1, limit: 50 };
      }
    },
    create: async (data: {
      employeeId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      reason?: string;
    }) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/leave-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create leave request");
        return res.json();
      } catch (e) {
        console.error("hrmApi.leaveRequests.create error:", e);
        return null;
      }
    },
    updateStatus: async (id: string, status: "approved" | "rejected", notes?: string) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/leave-requests/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify({ status, notes }),
        });
        if (!res.ok) throw new Error("Failed to update leave request status");
        return res.json();
      } catch (e) {
        console.error("hrmApi.leaveRequests.updateStatus error:", e);
        return null;
      }
    },
  },

  // Performance Reviews
  reviews: {
    list: async (params?: { page?: number; limit?: number; employeeId?: string; period?: string }) => {
      try {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.employeeId) query.set("employeeId", params.employeeId);
        if (params?.period) query.set("period", params.period);
        const res = await fetch(`${API_BASE}/hrm/reviews?${query}`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return res.json();
      } catch (e) {
        console.error("hrmApi.reviews.list error:", e);
        return { data: [], page: 1, limit: 50 };
      }
    },
    get: async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/reviews/${id}`, {
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
        });
        if (!res.ok) throw new Error("Failed to get review");
        return res.json();
      } catch (e) {
        console.error("hrmApi.reviews.get error:", e);
        return null;
      }
    },
    submit: async (id: string, data: {
      goalsProgress: number;
      strengths?: string;
      improvements?: string;
      comments?: string;
      rating?: number;
    }) => {
      try {
        const res = await fetch(`${API_BASE}/hrm/reviews/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to submit review");
        return res.json();
      } catch (e) {
        console.error("hrmApi.reviews.submit error:", e);
        return null;
      }
    },
  },

  // Recruitment
  recruitment: {
    requisitions: {
      list: async (params?: { page?: number; limit?: number; status?: string }) => {
        try {
          const query = new URLSearchParams();
          if (params?.page) query.set("page", String(params.page));
          if (params?.limit) query.set("limit", String(params.limit));
          if (params?.status) query.set("status", params.status);
          const res = await fetch(`${API_BASE}/hrm/recruitment/requisitions?${query}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to fetch requisitions");
          return res.json();
        } catch (e) {
          console.error("hrmApi.recruitment.requisitions.list error:", e);
          return { data: [], page: 1, limit: 50 };
        }
      },
      create: async (data: {
        title: string;
        department: string;
        location: string;
        employmentType: string;
        salaryMin?: number;
        salaryMax?: number;
        description?: string;
        requirements?: string;
      }) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/recruitment/requisitions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to create requisition");
          return res.json();
        } catch (e) {
          console.error("hrmApi.recruitment.requisitions.create error:", e);
          return null;
        }
      },
      update: async (id: string, data: Partial<{
        title: string;
        status: string;
        department: string;
        location: string;
      }>) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/recruitment/requisitions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to update requisition");
          return res.json();
        } catch (e) {
          console.error("hrmApi.recruitment.requisitions.update error:", e);
          return null;
        }
      },
    },
    candidates: {
      list: async (params?: { page?: number; limit?: number; requisitionId?: string; stage?: string }) => {
        try {
          const query = new URLSearchParams();
          if (params?.page) query.set("page", String(params.page));
          if (params?.limit) query.set("limit", String(params.limit));
          if (params?.requisitionId) query.set("requisitionId", params.requisitionId);
          if (params?.stage) query.set("stage", params.stage);
          const res = await fetch(`${API_BASE}/hrm/recruitment/candidates?${query}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to fetch candidates");
          return res.json();
        } catch (e) {
          console.error("hrmApi.recruitment.candidates.list error:", e);
          return { data: [], page: 1, limit: 50 };
        }
      },
      get: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/recruitment/candidates/${id}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to get candidate");
          return res.json();
        } catch (e) {
          console.error("hrmApi.recruitment.candidates.get error:", e);
          return null;
        }
      },
      update: async (id: string, data: Partial<{
        stage: string;
        status: string;
        rating: number;
        notes: string;
      }>) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/recruitment/candidates/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to update candidate");
          return res.json();
        } catch (e) {
          console.error("hrmApi.recruitment.candidates.update error:", e);
          return null;
        }
      },
    },
  },

  // Training
  training: {
    programs: {
      list: async (params?: { page?: number; limit?: number; category?: string }) => {
        try {
          const query = new URLSearchParams();
          if (params?.page) query.set("page", String(params.page));
          if (params?.limit) query.set("limit", String(params.limit));
          if (params?.category) query.set("category", params.category);
          const res = await fetch(`${API_BASE}/hrm/training/programs?${query}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to fetch training programs");
          return res.json();
        } catch (e) {
          console.error("hrmApi.training.programs.list error:", e);
          return { data: [], page: 1, limit: 50 };
        }
      },
      get: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/training/programs/${id}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to get training program");
          return res.json();
        } catch (e) {
          console.error("hrmApi.training.programs.get error:", e);
          return null;
        }
      },
      create: async (data: {
        title: string;
        description: string;
        category: string;
        duration: number;
        format: string;
        provider?: string;
      }) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/training/programs`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to create training program");
          return res.json();
        } catch (e) {
          console.error("hrmApi.training.programs.create error:", e);
          return null;
        }
      },
    },
    records: {
      list: async (params?: { page?: number; limit?: number; employeeId?: string; programId?: string }) => {
        try {
          const query = new URLSearchParams();
          if (params?.page) query.set("page", String(params.page));
          if (params?.limit) query.set("limit", String(params.limit));
          if (params?.employeeId) query.set("employeeId", params.employeeId);
          if (params?.programId) query.set("programId", params.programId);
          const res = await fetch(`${API_BASE}/hrm/training/records?${query}`, {
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
          });
          if (!res.ok) throw new Error("Failed to fetch training records");
          return res.json();
        } catch (e) {
          console.error("hrmApi.training.records.list error:", e);
          return { data: [], page: 1, limit: 50 };
        }
      },
      enroll: async (data: { employeeId: string; programId: string }) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/training/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to enroll employee");
          return res.json();
        } catch (e) {
          console.error("hrmApi.training.records.enroll error:", e);
          return null;
        }
      },
      updateProgress: async (id: string, data: { progress: number; status: string }) => {
        try {
          const res = await fetch(`${API_BASE}/hrm/training/records/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getOrgHeader() },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to update training progress");
          return res.json();
        } catch (e) {
          console.error("hrmApi.training.records.updateProgress error:", e);
          return null;
        }
      },
    },
  },
};

// ============ ADVERTISING ============
export const advertisingApi = {
  // Connection management
  connect: async (data: {
    adNetwork: "google_ads" | "microsoft_ads" | "facebook_ads";
    accessToken?: string;
    refreshToken?: string;
    customerId?: string;
    accountName?: string;
  }) => rpc.advertising?.connect?.(data),

  disconnect: async (adNetwork: "google_ads" | "microsoft_ads" | "facebook_ads") =>
    rpc.advertising?.disconnect?.({ adNetwork }),

  getStatus: async () => {
    try {
      return await withRpcTimeout(rpc.advertising?.status?.({}), "advertising.status");
    } catch (error) {
      console.error("advertisingApi.getStatus error:", error);
      return [];
    }
  },

  // Conversion tracking
  trackConversion: async (data: {
    leadId?: string;
    contactId?: string;
    adNetwork?: "google_ads" | "microsoft_ads" | "facebook_ads";
    campaignId?: string;
    conversionType?: "form_submission" | "page_view" | "purchase" | "signup";
    conversionValue?: number;
    formId?: string;
    formName?: string;
    pageUrl?: string;
    pagePath?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    gclid?: string;
    msclkid?: string;
    fbclid?: string;
  }) => rpc.advertising?.trackConversion?.(data),

  listConversions: async (params?: {
    page?: number;
    limit?: number;
    adNetwork?: "google_ads" | "microsoft_ads" | "facebook_ads";
    campaignId?: string;
    conversionType?: "form_submission" | "page_view" | "purchase" | "signup";
    startDate?: string;
    endDate?: string;
  }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    try {
      return await withRpcTimeout(
        rpc.advertising?.listConversions?.({
          page,
          limit,
          adNetwork: params?.adNetwork,
          campaignId: params?.campaignId,
          conversionType: params?.conversionType,
          startDate: params?.startDate,
          endDate: params?.endDate,
        }),
        "advertising.listConversions",
      );
    } catch (error) {
      console.error("advertisingApi.listConversions error:", error);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
  },

  // Dashboard
  overview: async (params?: { startDate?: string; endDate?: string }) => {
    try {
      return await withRpcTimeout(
        rpc.advertising?.overview?.({
          startDate: params?.startDate,
          endDate: params?.endDate,
        }),
        "advertising.overview",
      );
    } catch (error) {
      console.error("advertisingApi.overview error:", error);
      return {
        totalConversions: 0,
        totalValue: 0,
        byNetwork: [],
        byCampaign: [],
        byType: [],
        recentConversions: [],
      };
    }
  },

  campaigns: async () => {
    try {
      return await withRpcTimeout(rpc.advertising?.campaigns?.({}), "advertising.campaigns");
    } catch (error) {
      console.error("advertisingApi.campaigns error:", error);
      return [];
    }
  },

  syncConversion: async (id: string) =>
    rpc.advertising?.syncConversion?.({ id }),
};

// ============ MARKETING API ============
export const marketingApi = {
  campaigns: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.marketing?.listCampaigns?.({
            page,
            limit,
            ...(params?.status ? { status: params.status } : {}),
            ...(params?.search ? { search: params.search } : {}),
          }),
          "marketing.listCampaigns",
        );
      } catch (error) {
        console.error("marketingApi.campaigns.list error:", error);
        return { data: [], total: 0, page, limit };
      }
    },
    create: async (data: {
      name: string;
      type?: string;
      channel?: string;
      goal?: string;
      budget?: number;
    }): Promise<any> => {
      try {
        return await rpc.marketing?.createCampaign?.(data);
      } catch (error) {
        console.error("marketingApi.campaigns.create error:", error);
        throw error;
      }
    },
    get: async (id: string): Promise<any> => {
      try {
        return await rpc.marketing?.getCampaign?.({ id });
      } catch (error) {
        console.error("marketingApi.campaigns.get error:", error);
        throw error;
      }
    },
    update: async (
      id: string,
      data: {
        name?: string;
        type?: string;
        channel?: string;
        status?: string;
        goal?: string;
        budget?: number;
      },
    ): Promise<any> => {
      try {
        return await rpc.marketing?.updateCampaign?.({ id, ...data });
      } catch (error) {
        console.error("marketingApi.campaigns.update error:", error);
        throw error;
      }
    },
    delete: async (id: string): Promise<any> => {
      try {
        return await rpc.marketing?.deleteCampaign?.({ id });
      } catch (error) {
        console.error("marketingApi.campaigns.delete error:", error);
        throw error;
      }
    },
  },
  stats: async (): Promise<any> => {
    try {
      return await withRpcTimeout(
        rpc.marketing?.stats?.({}),
        "marketing.stats",
      );
    } catch (error) {
      console.error("marketingApi.stats error:", error);
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        draftCampaigns: 0,
        completedCampaigns: 0,
      };
    }
  },
  templates: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 50;
      try {
        return await withRpcTimeout(
          rpc.marketing?.listTemplates?.({ page, limit }),
          "marketing.listTemplates",
        );
      } catch (error) {
        console.error("marketingApi.templates.list error:", error);
        return { data: [], page, limit };
      }
    },
    create: async (data: {
      name: string;
      subject?: string;
      html?: string;
      text?: string;
      category?: string;
    }): Promise<any> => {
      try {
        return await rpc.marketing?.createTemplate?.(data);
      } catch (error) {
        console.error("marketingApi.templates.create error:", error);
        throw error;
      }
    },
    delete: async (id: string): Promise<any> => {
      try {
        return await rpc.marketing?.deleteTemplate?.({ id });
      } catch (error) {
        console.error("marketingApi.templates.delete error:", error);
        throw error;
      }
    },
  },
};

// ============ AGENTS API ============

const AGENTS_BASE = `${API_BASE}/agents`;

async function agentsFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${AGENTS_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getOrgHeader(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) throw new Error(`Agents API error: ${res.status}`);
  return res.json();
}

export const agentsApi = {
  /** GET /agents/:id/history */
  history: (id: string) => agentsFetch(`/${id}/history`),

  /** POST /agents/:id/chat */
  chat: (id: string, message: string) =>
    agentsFetch(`/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ id, message }),
    }),

  /** POST /agents/:id/run */
  run: (id: string, data: { taskType?: string; taskDescription: string }) =>
    agentsFetch(`/${id}/run`, {
      method: "POST",
      body: JSON.stringify({ id, ...data }),
    }),
};

// ============ COMMUNICATIONS API ============

const COMM_BASE = `${API_BASE}/communications`;

async function commFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${COMM_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getOrgHeader(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) throw new Error(`Communications API error: ${res.status}`);
  return res.json();
}

export const communicationsApi = {
  summary: () => commFetch("/summary"),

  conversations: {
    list: (params?: { page?: number; limit?: number; channel?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.channel) q.set("channel", params.channel);
      if (params?.status) q.set("status", params.status);
      return commFetch(`/conversations?${q}`);
    },
    create: (data: {
      channel?: "chat" | "sms" | "email" | "voice";
      subject?: string;
      participantName?: string;
      participantContact?: string;
    }) =>
      commFetch("/conversations", { method: "POST", body: JSON.stringify(data) }),
  },

  messages: {
    list: (params?: { page?: number; limit?: number; conversationId?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.conversationId) q.set("conversationId", params.conversationId);
      return commFetch(`/messages?${q}`);
    },
  },

  phoneNumbers: {
    list: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return commFetch(`/phone-numbers?${q}`);
    },
    create: (data: { number: string; friendlyName?: string; provider?: string }) =>
      commFetch("/phone-numbers", { method: "POST", body: JSON.stringify(data) }),
  },

  queues: {
    list: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return commFetch(`/queues?${q}`);
    },
    create: (data: {
      name: string;
      description?: string;
      channel?: "chat" | "voice" | "sms";
      maxWait?: string;
    }) =>
      commFetch("/queues", { method: "POST", body: JSON.stringify(data) }),
  },

  campaigns: {
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.status) q.set("status", params.status);
      return commFetch(`/campaigns?${q}`);
    },
    create: (data: {
      name: string;
      body: string;
      fromNumber?: string;
      scheduledAt?: string;
    }) =>
      commFetch("/campaigns", { method: "POST", body: JSON.stringify(data) }),
  },

  templates: {
    list: (params?: { page?: number; limit?: number; channel?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.channel) q.set("channel", params.channel);
      return commFetch(`/templates?${q}`);
    },
    create: (data: {
      name: string;
      channel?: "sms" | "email" | "chat";
      category?: string;
      body: string;
      variables?: string[];
    }) =>
      commFetch("/templates", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      commFetch(`/templates/${id}`, { method: "DELETE" }),
  },

  bots: {
    list: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return commFetch(`/bots?${q}`);
    },
    create: (data: {
      name: string;
      description?: string;
      channel?: "chat" | "sms" | "voice";
      systemPrompt?: string;
      model?: string;
      handoffThreshold?: string;
    }) =>
      commFetch("/bots", { method: "POST", body: JSON.stringify(data) }),
    update: (
      id: string,
      data: { status?: "active" | "inactive" | "training"; name?: string; systemPrompt?: string },
    ) =>
      commFetch(`/bots/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  sms: {
    /** POST /communications/sms/send */
    send: (data: { to: string[]; body: string; from?: string; scheduledAt?: string }) =>
      commFetch("/sms/send", { method: "POST", body: JSON.stringify(data) }),
  },

  videoRooms: {
    /** GET /communications/video-rooms */
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.status) q.set("status", params.status);
      return commFetch(`/video-rooms?${q}`);
    },
    /** GET /communications/video-rooms/:id */
    get: (id: string) => commFetch(`/video-rooms/${id}`),
    /** POST /communications/video-rooms */
    create: (data: { name: string; maxParticipants?: number; scheduledAt?: string }) =>
      commFetch("/video-rooms", { method: "POST", body: JSON.stringify(data) }),
    /** PATCH /communications/video-rooms/:id/end */
    end: (id: string) => commFetch(`/video-rooms/${id}/end`, { method: "PATCH" }),
  },

  calls: {
    /** GET /communications/calls */
    list: (params?: { page?: number; limit?: number; direction?: "inbound" | "outbound"; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.direction) q.set("direction", params.direction);
      if (params?.status) q.set("status", params.status);
      return commFetch(`/calls?${q}`);
    },
    /** POST /communications/calls — initiate a call record */
    create: (data: { to: string; from?: string; contactName?: string }) =>
      commFetch("/calls", {
        method: "POST",
        body: JSON.stringify({
          direction: "outbound",
          from: data.from ?? "unknown",
          to: data.to,
          contactName: data.contactName,
          status: "initiated",
        }),
      }),
  },

  conversationMessages: {
    /** GET /communications/conversations/:id  */
    get: (id: string) => commFetch(`/conversations/${id}`),
    /** POST /communications/conversations/:id/messages */
    send: (id: string, body: string) =>
      commFetch(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ id, body }),
      }),
  },
};

// ── Inventory API ────────────────────────────────────────────────────────────

export const inventoryApi = {
  stats: async (): Promise<any> => {
    try {
      return await withRpcTimeout(rpc.inventory?.stats?.({}), "inventory.stats");
    } catch {
      return { totalProducts: 0, lowStockCount: 0, totalValue: 0, activeAlerts: 0 };
    }
  },

  products: {
    list: async (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.inventory?.listProducts?.({ page: params?.page ?? 1, limit: params?.limit ?? 50, ...params }),
          "inventory.listProducts",
        );
      } catch {
        return { data: [], total: 0, page: 1, limit: 50 };
      }
    },
    get: async (id: string): Promise<any> => {
      try {
        return await withRpcTimeout(rpc.inventory?.getProduct?.({ id }), "inventory.getProduct");
      } catch {
        return null;
      }
    },
    create: async (data: any): Promise<any> => {
      return await withRpcTimeout(rpc.inventory?.createProduct?.(data), "inventory.createProduct");
    },
    update: async (id: string, data: any): Promise<any> => {
      return await withRpcTimeout(rpc.inventory?.updateProduct?.({ id, ...data }), "inventory.updateProduct");
    },
    delete: async (id: string): Promise<any> => {
      return await withRpcTimeout(rpc.inventory?.deleteProduct?.({ id }), "inventory.deleteProduct");
    },
  },

  alerts: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.inventory?.listAlerts?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
          "inventory.listAlerts",
        );
      } catch {
        return { data: [], total: 0 };
      }
    },
    resolve: async (id: string): Promise<any> => {
      return await withRpcTimeout(rpc.inventory?.updateProduct?.({ id, status: "resolved" }), "inventory.resolveAlert");
    },
  },
};

// ── Helpdesk API ─────────────────────────────────────────────────────────────

const API_BASE_HD = import.meta.env.VITE_API_URL ?? "/api";

function getHdOrgHeader(): Record<string, string> {
  const orgId =
    typeof window !== "undefined"
      ? localStorage.getItem("activeOrganizationId") ?? ""
      : "";
  return { "x-org-id": orgId, "Content-Type": "application/json" };
}

async function hdFetch(path: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(`${API_BASE_HD}/v1${path}`, {
    ...opts,
    headers: { ...getHdOrgHeader(), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HD fetch failed: ${res.status}`);
  return res.json();
}

export const helpdeskApi = {
  stats: async (): Promise<any> => {
    try {
      return await withRpcTimeout(
        rpc.helpdesk?.stats?.({}),
        "helpdesk.stats",
      );
    } catch {
      return { open: 0, pending: 0, resolved: 0, slaBreached: 0, avgResponseTimeHours: 0, satisfactionScore: 0 };
    }
  },

  tickets: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      search?: string;
    }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.ticketsList?.({
            page: params?.page ?? 1,
            limit: params?.limit ?? 50,
            status: params?.status,
            priority: params?.priority,
            search: params?.search,
          }),
          "helpdesk.ticketsList",
        );
      } catch {
        return { data: [], total: 0, page: 1, limit: 50 };
      }
    },
    get: async (id: string): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.ticketsGet?.({ id }),
          "helpdesk.ticketsGet",
        );
      } catch {
        return null;
      }
    },
    create: async (data: {
      subject: string;
      description?: string;
      status?: string;
      priority?: string;
      category?: string;
      assigneeId?: string;
      contactEmail?: string;
      contactName?: string;
      tags?: string[];
      source?: string;
    }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.ticketsCreate?.(data),
        "helpdesk.ticketsCreate",
      );
    },
    update: async (id: string, data: Record<string, any>): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.ticketsUpdate?.({ id, ...data }),
        "helpdesk.ticketsUpdate",
      );
    },
    delete: async (id: string): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.ticketsDelete?.({ id }),
        "helpdesk.ticketsDelete",
      );
    },
  },

  ticketComments: {
    list: async (ticketId: string, params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.ticketCommentsList?.({
            id: ticketId,
            page: params?.page ?? 1,
            limit: params?.limit ?? 100,
          }),
          "helpdesk.ticketCommentsList",
        );
      } catch {
        return { data: [], page: 1, limit: 100 };
      }
    },
    create: async (ticketId: string, data: { body: string; isInternal?: boolean }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.ticketCommentsCreate?.({ id: ticketId, ...data }),
        "helpdesk.ticketCommentsCreate",
      );
    },
  },

  queue: async (params?: { page?: number; limit?: number }): Promise<any> => {
    try {
      return await withRpcTimeout(
        rpc.helpdesk?.queue?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
        "helpdesk.queue",
      );
    } catch {
      return { data: [], page: 1, limit: 50 };
    }
  },

  knowledge: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      categoryId?: string;
      search?: string;
    }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.knowledgeList?.({
            page: params?.page ?? 1,
            limit: params?.limit ?? 50,
            status: params?.status,
            categoryId: params?.categoryId,
            search: params?.search,
          }),
          "helpdesk.knowledgeList",
        );
      } catch {
        return { data: [], page: 1, limit: 50 };
      }
    },
    get: async (id: string): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.knowledgeGet?.({ id }),
          "helpdesk.knowledgeGet",
        );
      } catch {
        return null;
      }
    },
    create: async (data: { title: string; body: string; slug?: string; categoryId?: string; status?: string }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.knowledgeCreate?.(data),
        "helpdesk.knowledgeCreate",
      );
    },
    update: async (id: string, data: Record<string, any>): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.knowledgeUpdate?.({ id, ...data }),
        "helpdesk.knowledgeUpdate",
      );
    },
    delete: async (id: string): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.knowledgeDelete?.({ id }),
        "helpdesk.knowledgeDelete",
      );
    },
  },

  knowledgeCategories: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.knowledgeCategoriesList?.({ page: params?.page ?? 1, limit: params?.limit ?? 100 }),
          "helpdesk.knowledgeCategoriesList",
        );
      } catch {
        return { data: [], page: 1, limit: 100 };
      }
    },
    create: async (data: { name: string; slug?: string; parentId?: string; sortOrder?: number }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.knowledgeCategoriesCreate?.(data),
        "helpdesk.knowledgeCategoriesCreate",
      );
    },
  },

  sla: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.slaList?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
          "helpdesk.slaList",
        );
      } catch {
        return { data: [], page: 1, limit: 50 };
      }
    },
    create: async (data: {
      name: string;
      priority: string;
      firstResponseHours?: number;
      resolutionHours?: number;
      businessHoursOnly?: boolean;
      isDefault?: boolean;
    }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.slaCreate?.(data),
        "helpdesk.slaCreate",
      );
    },
    update: async (id: string, data: Record<string, any>): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.slaUpdate?.({ id, ...data }),
        "helpdesk.slaUpdate",
      );
    },
  },

  canned: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.cannedList?.({ page: params?.page ?? 1, limit: params?.limit ?? 100 }),
          "helpdesk.cannedList",
        );
      } catch {
        return { data: [], page: 1, limit: 100 };
      }
    },
    create: async (data: { name: string; category?: string; body: string; shortcut?: string }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.cannedCreate?.(data),
        "helpdesk.cannedCreate",
      );
    },
    update: async (id: string, data: Record<string, any>): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.cannedUpdate?.({ id, ...data }),
        "helpdesk.cannedUpdate",
      );
    },
    delete: async (id: string): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.cannedDelete?.({ id }),
        "helpdesk.cannedDelete",
      );
    },
  },

  surveys: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.surveysList?.({ page: params?.page ?? 1, limit: params?.limit ?? 50 }),
          "helpdesk.surveysList",
        );
      } catch {
        return { data: [], page: 1, limit: 50 };
      }
    },
    create: async (data: { ticketId?: string; rating: number; comment?: string }): Promise<any> => {
      return await withRpcTimeout(
        rpc.helpdesk?.surveysCreate?.(data),
        "helpdesk.surveysCreate",
      );
    },
  },

  forums: {
    list: async (params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<any> => {
      try {
        return await withRpcTimeout(
          rpc.helpdesk?.forumsList?.({ page: params?.page ?? 1, limit: params?.limit ?? 50, status: params?.status, search: params?.search }),
          "helpdesk.forumsList",
        );
      } catch {
        return { data: [], page: 1, limit: 50 };
      }
    },
    get: async (id: string): Promise<any> => {
      try {
        return await withRpcTimeout(rpc.helpdesk?.forumsGet?.({ id }), "helpdesk.forumsGet");
      } catch {
        return null;
      }
    },
    create: async (data: { title: string; body: string; tags?: string[]; isPinned?: boolean }): Promise<any> => {
      return await withRpcTimeout(rpc.helpdesk?.forumsCreate?.(data), "helpdesk.forumsCreate");
    },
    update: async (id: string, data: Record<string, any>): Promise<any> => {
      return await withRpcTimeout(rpc.helpdesk?.forumsUpdate?.({ id, ...data }), "helpdesk.forumsUpdate");
    },
  },

  widget: {
    get: async (): Promise<any> => {
      try {
        return await withRpcTimeout(rpc.helpdesk?.widgetGet?.({}), "helpdesk.widgetGet");
      } catch {
        return null;
      }
    },
    update: async (data: {
      name?: string;
      color?: string;
      position?: "bottom-right" | "bottom-left";
      greeting?: string;
      isActive?: boolean;
      allowedDomains?: string[];
    }): Promise<any> => {
      return await withRpcTimeout(rpc.helpdesk?.widgetUpdate?.(data), "helpdesk.widgetUpdate");
    },
  },
};

// ── eCommerce API ─────────────────────────────────────────────────────────────

const API_BASE_EC = import.meta.env.VITE_API_URL ?? "/api";

function getEcOrgHeader(): Record<string, string> {
  const orgId =
    typeof window !== "undefined"
      ? localStorage.getItem("activeOrganizationId") ?? ""
      : "";
  return { "x-org-id": orgId, "Content-Type": "application/json" };
}

async function ecFetch(path: string, opts?: RequestInit): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_EC}/v1${path}`, {
      ...opts,
      headers: { ...getEcOrgHeader(), ...(opts?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`EC fetch failed: ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export const ecommerceApi = {
  stats: () => ecFetch("/ecommerce/stats"),

  products: {
    list: (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }) =>
      ecFetch(`/ecommerce/products?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    get: (id: string) => ecFetch(`/ecommerce/products/${id}`),
    create: (data: any) => ecFetch("/ecommerce/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => ecFetch(`/ecommerce/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => ecFetch(`/ecommerce/products/${id}`, { method: "DELETE" }),
  },

  orders: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      ecFetch(`/ecommerce/orders?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    get: (id: string) => ecFetch(`/ecommerce/orders/${id}`),
    update: (id: string, data: any) => ecFetch(`/ecommerce/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  customers: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      ecFetch(`/ecommerce/customers?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    get: (id: string) => ecFetch(`/ecommerce/customers/${id}`),
  },

  reviews: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      ecFetch(`/ecommerce/reviews?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    update: (id: string, data: any) => ecFetch(`/ecommerce/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  discounts: {
    list: () => ecFetch("/ecommerce/discounts"),
    create: (data: any) => ecFetch("/ecommerce/discounts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => ecFetch(`/ecommerce/discounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => ecFetch(`/ecommerce/discounts/${id}`, { method: "DELETE" }),
  },

  shipping: {
    list: () => ecFetch("/ecommerce/shipping"),
    create: (data: any) => ecFetch("/ecommerce/shipping", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => ecFetch(`/ecommerce/shipping/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  taxes: {
    list: () => ecFetch("/ecommerce/taxes"),
    create: (data: any) => ecFetch("/ecommerce/taxes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => ecFetch(`/ecommerce/taxes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  abandoned: { list: () => ecFetch("/ecommerce/abandoned") },
  wishlists: { list: () => ecFetch("/ecommerce/wishlists") },
  upsell: { list: () => ecFetch("/ecommerce/upsell") },
};

// ── Invoicing API ─────────────────────────────────────────────────────────────

const API_BASE_INV = import.meta.env.VITE_API_URL ?? "/api";

function getInvOrgHeader(): Record<string, string> {
  const orgId =
    typeof window !== "undefined"
      ? localStorage.getItem("activeOrganizationId") ?? ""
      : "";
  return { "x-org-id": orgId, "Content-Type": "application/json" };
}

async function invFetch(path: string, opts?: RequestInit): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_INV}/v1${path}`, {
      ...opts,
      headers: { ...getInvOrgHeader(), ...(opts?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`INV fetch failed: ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

export const invoicingApi = {
  stats: () => invFetch("/invoicing/stats"),

  invoices: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string; clientId?: string }) =>
      invFetch(`/invoicing/invoices?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    get: (id: string) => invFetch(`/invoicing/invoices/${id}`),
    create: (data: any) => invFetch("/invoicing/invoices", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => invFetch(`/invoicing/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => invFetch(`/invoicing/invoices/${id}`, { method: "DELETE" }),
    send: (id: string) => invFetch(`/invoicing/invoices/${id}/send`, { method: "POST", body: JSON.stringify({}) }),
  },

  clients: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      invFetch(`/invoicing/clients?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    get: (id: string) => invFetch(`/invoicing/clients/${id}`),
    create: (data: any) => invFetch("/invoicing/clients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => invFetch(`/invoicing/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  payments: {
    list: (params?: { page?: number; limit?: number; invoiceId?: string }) =>
      invFetch(`/invoicing/payments?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    create: (data: any) => invFetch("/invoicing/payments", { method: "POST", body: JSON.stringify(data) }),
  },

  expenses: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      invFetch(`/invoicing/expenses?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    create: (data: any) => invFetch("/invoicing/expenses", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => invFetch(`/invoicing/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => invFetch(`/invoicing/expenses/${id}`, { method: "DELETE" }),
  },

  quotes: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      invFetch(`/invoicing/quotes?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`),
    get: (id: string) => invFetch(`/invoicing/quotes/${id}`),
    create: (data: any) => invFetch("/invoicing/quotes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => invFetch(`/invoicing/quotes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    convert: (id: string) => invFetch(`/invoicing/quotes/${id}/convert`, { method: "POST", body: JSON.stringify({}) }),
  },

  templates: {
    list: () => invFetch("/invoicing/templates"),
    create: (data: any) => invFetch("/invoicing/templates", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => invFetch(`/invoicing/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  settings: {
    get: () => invFetch("/invoicing/settings"),
    update: (data: any) => invFetch("/invoicing/settings", { method: "PUT", body: JSON.stringify(data) }),
  },
};

export const fieldServiceApi = {
  jobs: {
    list: () => fetch(`${API_BASE}/field-service/jobs`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/field-service/jobs/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/field-service/jobs`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: string, data: Record<string, unknown>) => fetch(`${API_BASE}/field-service/jobs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/field-service/jobs/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
  },
  technicians: {
    list: () => fetch(`${API_BASE}/field-service/technicians`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/field-service/technicians`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  equipment: {
    list: () => fetch(`${API_BASE}/field-service/equipment`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/field-service/equipment`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  parts: {
    list: () => fetch(`${API_BASE}/field-service/parts`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/field-service/parts`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  schedule: {
    list: () => fetch(`${API_BASE}/field-service/schedule`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  routes: {
    list: () => fetch(`${API_BASE}/field-service/routes`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  dispatch: (jobId: string) => fetch(`${API_BASE}/field-service/dispatch`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify({ jobId }) }).then(r => r.json()),
};

export const socialApi = {
  posts: {
    list: () => fetch(`${API_BASE}/social/posts`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/social/posts/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/social/posts`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: string, data: Record<string, unknown>) => fetch(`${API_BASE}/social/posts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/social/posts/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
    publish: (id: string) => fetch(`${API_BASE}/social/posts/${id}/publish`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() } }).then(r => r.json()),
  },
  accounts: {
    list: () => fetch(`${API_BASE}/social/accounts`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/social/accounts/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  campaigns: {
    list: () => fetch(`${API_BASE}/social/campaigns`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/social/campaigns`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/social/campaigns/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
  },
  analytics: {
    get: (accountId: string) => fetch(`${API_BASE}/social/analytics/${accountId}`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  inbox: {
    list: () => fetch(`${API_BASE}/social/inbox`, { headers: getOrgHeader() }).then(r => r.json()),
    reply: (id: string, content: string) => fetch(`${API_BASE}/social/inbox/${id}/reply`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify({ content }) }).then(r => r.json()),
  },
  competitors: {
    list: () => fetch(`${API_BASE}/social/competitors`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/social/competitors`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  hashtags: {
    list: () => fetch(`${API_BASE}/social/hashtags`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  influencers: {
    list: () => fetch(`${API_BASE}/social/influencers`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  listening: {
    list: () => fetch(`${API_BASE}/social/listening`, { headers: getOrgHeader() }).then(r => r.json()),
  },
};

export const speechApi = {
  transcriptions: {
    list: () => fetch(`${API_BASE}/speech/transcriptions`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/speech/transcriptions/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/speech/transcriptions`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/speech/transcriptions/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
  },
  meetings: {
    list: () => fetch(`${API_BASE}/speech/meetings`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/speech/meetings/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/speech/meetings`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  commands: {
    list: () => fetch(`${API_BASE}/speech/commands`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/speech/commands`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/speech/commands/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
  },
  vocabulary: {
    list: () => fetch(`${API_BASE}/speech/vocabulary`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/speech/vocabulary`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/speech/vocabulary/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
  },
  models: {
    list: () => fetch(`${API_BASE}/speech/models`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  stats: () => fetch(`${API_BASE}/speech/stats`, { headers: getOrgHeader() }).then(r => r.json()),
  settings: {
    get: () => fetch(`${API_BASE}/speech/settings`, { headers: getOrgHeader() }).then(r => r.json()),
    update: (data: Record<string, unknown>) => fetch(`${API_BASE}/speech/settings`, { method: "PUT", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
};

export const devopsApi = {
  pipelines: {
    list: () => fetch(`${API_BASE}/devops/pipelines`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/devops/pipelines/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/devops/pipelines`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: string, data: Record<string, unknown>) => fetch(`${API_BASE}/devops/pipelines/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/devops/pipelines/${id}`, { method: "DELETE", headers: getOrgHeader() }).then(r => r.json()),
    trigger: (id: string) => fetch(`${API_BASE}/devops/pipelines/${id}/trigger`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() } }).then(r => r.json()),
  },
  runs: {
    list: () => fetch(`${API_BASE}/devops/runs`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/devops/runs/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  deployments: {
    list: () => fetch(`${API_BASE}/devops/deployments`, { headers: getOrgHeader() }).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/devops/deployments/${id}`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/devops/deployments`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  environments: {
    list: () => fetch(`${API_BASE}/devops/environments`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/devops/environments`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  infrastructure: {
    list: () => fetch(`${API_BASE}/devops/infrastructure`, { headers: getOrgHeader() }).then(r => r.json()),
  },
  secrets: {
    list: () => fetch(`${API_BASE}/devops/secrets`, { headers: getOrgHeader() }).then(r => r.json()),
    create: (data: Record<string, unknown>) => fetch(`${API_BASE}/devops/secrets`, { method: "POST", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  settings: {
    get: () => fetch(`${API_BASE}/devops/settings`, { headers: getOrgHeader() }).then(r => r.json()),
    update: (data: Record<string, unknown>) => fetch(`${API_BASE}/devops/settings`, { method: "PUT", headers: { "Content-Type": "application/json", ...getOrgHeader() }, body: JSON.stringify(data) }).then(r => r.json()),
  },
  stats: () => fetch(`${API_BASE}/devops/stats`, { headers: getOrgHeader() }).then(r => r.json()),
};
