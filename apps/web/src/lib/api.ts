/**
 * API Client
 *
 * Re-exports oRPC client utilities and TanStack Query setup.
 */

export {
  api as client,
  orpc,
  contactsClient,
  dealsClient,
  leadsClient,
  activitiesClient,
  dashboardClient,
  assetsClient,
} from "./orpc";
export { queryClient } from "./query";

/**
 * Legacy API helpers for gradual migration
 * These wrap oRPC calls to maintain backward compatibility with existing components.
 */

import { api as client } from "./orpc";

// ============ CONTACTS ============
export const contactsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const result = await client.contacts.list({
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
    });
    return result;
  },
  get: async (id: string) => {
    return client.contacts.get({ id });
  },
  create: async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
  }) => {
    return client.contacts.create(data);
  },
  delete: async (id: string) => {
    return client.contacts.delete({ id });
  },
};

// ============ DEALS ============
export const dealsApi = {
  list: async (params?: { page?: number; limit?: number; stage?: string }) => {
    const result = await client.deals.list({
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
    });
    return result;
  },
  create: async (data: any) => {
    return client.deals.create(data);
  },
  update: async (id: string, data: any) => {
    return client.deals.update({ id, ...data });
  },
  updateStage: async (id: string, stage: string) => {
    return client.deals.updateStage({ id, stage });
  },
  delete: async (id: string) => {
    return client.deals.delete({ id });
  },
};

// ============ LEADS ============
export const leadsApi = {
  list: async (params?: { page?: number; limit?: number; status?: string }) => {
    const result = await client.leads.list({
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
    });
    return result;
  },
  create: async (data: any) => {
    return client.leads.create(data);
  },
  update: async (id: string, data: any) => {
    return client.leads.update({ id, ...data });
  },
  convert: async (id: string, data: any) => {
    return client.leads.convert({ id, ...data });
  },
  delete: async (id: string) => {
    return client.leads.delete({ id });
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
    const result = await client.activities.list({
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
      contactId: params?.contactId,
      dealId: params?.dealId,
    });
    return result;
  },
  create: async (data: any) => {
    return client.activities.create(data);
  },
  update: async (id: string, data: any) => {
    return client.activities.update({ id, ...data });
  },
  delete: async (id: string) => {
    return client.activities.delete({ id });
  },
};

// ============ DASHBOARD ============
export const dashboardApi = {
  getStats: async () => {
    return client.dashboard.stats({});
  },
};
// ============ ASSETS ============
export const assetsApi = {
  list: async (params?: { limit?: number; cursor?: number }) => {
    return client.assets.list({
      limit: params?.limit ?? 50,
      cursor: params?.cursor ?? 0,
    });
  },
  create: async (data: { name: string; type: string; size: number }) => {
    return client.assets.create(data);
  },
  generateTags: async (id: string) => {
    return client.assets.generateTags({ id });
  },
  getSignedUrl: async (data: { filename: string; contentType: string }) => {
    return client.assets.getSignedUrl(data);
  },
};
