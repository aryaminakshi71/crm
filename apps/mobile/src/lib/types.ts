export type ListResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Deal = {
  id: string;
  name: string;
  value: number | string;
  stage?: string | null;
  probability?: number | null;
  expectedCloseDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Lead = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  source?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Activity = {
  id: string;
  type: string;
  title?: string | null;
  subject?: string | null;
  description?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
  version: string;
};

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type AuthSessionInfo = {
  id?: string;
  activeOrganizationId?: string | null;
  expiresAt?: string;
};

export type AuthSessionPayload = {
  user?: AuthUser | null;
  session?: AuthSessionInfo | null;
  activeOrganizationId?: string | null;
};
