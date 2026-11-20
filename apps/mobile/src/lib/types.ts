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

export type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt?: string;
  description?: string | null;
};

export type Employee = {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  department?: string | null;
  workEmail?: string | null;
  phone?: string | null;
  status?: string | null;
};

export type InventoryProduct = {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  stockQuantity?: number | null;
  price?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  status: string;
  total: number | string;
  dueAt?: string | null;
  createdAt?: string;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  createdAt?: string;
};

export type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  projectId?: string | null;
  dueDate?: string | null;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
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

export type FieldServiceJob = {
  id: string;
  jobNumber: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  location?: { lat: number; lng: number; address: string } | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  estimatedDuration?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
