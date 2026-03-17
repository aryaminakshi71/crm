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
              rpc.operations?.payrollRunsList?.({ page, limit }),
              "operations.payrollRunsList",
            );
          } catch (error) {
            console.error("nucleoApi.hrm.payroll.runs.list error:", error);
            return { data: [], page, limit };
          }
        },
        create: async (data: any) => rpc.operations?.payrollRunsCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.operations?.payrollRunsUpdate?.({ id, ...data }),
        delete: async (id: string) =>
          rpc.operations?.payrollRunsDelete?.({ id }),
      },
      entries: {
        list: async (params?: {
          page?: number;
          limit?: number;
        }): Promise<any> => {
          const page = params?.page ?? 1;
          const limit = params?.limit ?? 50;
          try {
            return await withRpcTimeout(
              rpc.operations?.payrollEntriesList?.({ page, limit }),
              "operations.payrollEntriesList",
            );
          } catch (error) {
            console.error("nucleoApi.hrm.payroll.entries.list error:", error);
            return { data: [], page, limit };
          }
        },
        create: async (data: any) =>
          rpc.operations?.payrollEntriesCreate?.(data),
        update: async (id: string, data: any) =>
          rpc.operations?.payrollEntriesUpdate?.({ id, ...data }),
        delete: async (id: string) =>
          rpc.operations?.payrollEntriesDelete?.({ id }),
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
};
