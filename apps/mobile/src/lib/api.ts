import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useMobileConfig } from "./mobile-config";
import type {
  Activity,
  AuthSessionPayload,
  Contact,
  Deal,
  Employee,
  FieldServiceJob,
  HealthResponse,
  InventoryProduct,
  Invoice,
  Lead,
  ListResponse,
  Notification,
  Project,
  Task,
  Ticket,
} from "./types";

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = "google" | "github";

type ClientConfig = {
  apiBaseUrl: string;
  demoMode: boolean;
  organizationId: string;
  authToken?: string | null;
};

type CreateContactInput = Pick<
  Contact,
  "firstName" | "lastName" | "email" | "phone" | "companyName"
>;

type CreateLeadInput = Pick<
  Lead,
  "firstName" | "lastName" | "email" | "companyName" | "source" | "status"
>;

type CreateDealInput = Pick<Deal, "name" | "value" | "stage" | "probability">;

type CreateActivityInput = Pick<
  Activity,
  "type" | "title" | "description" | "contactId" | "dealId"
>;

type CreateTicketInput = Pick<Ticket, "subject" | "priority"> & {
  description?: string | null;
};

type CreateInvoiceInput = Pick<Invoice, "status" | "total"> & {
  dueAt?: string | null;
};

type ListTasksInput = {
  projectId?: string;
};

function cleanBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function buildHeaders(config: ClientConfig) {
  const orgId = config.demoMode
    ? "demo-org"
    : config.organizationId.trim() || undefined;

  return {
    "Content-Type": "application/json",
    ...(config.authToken
      ? { Authorization: `Bearer ${config.authToken}` }
      : {}),
    ...(orgId ? { "x-organization-id": orgId } : {}),
  };
}

async function request<T>(
  config: ClientConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${cleanBaseUrl(config.apiBaseUrl)}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(config),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function createCrmClient(config: ClientConfig) {
  return {
    health: () => request<HealthResponse>(config, "/api/health"),
    contacts: {
      list: () => request<ListResponse<Contact>>(config, "/api/v1/contacts"),
      create: (input: CreateContactInput) =>
        request<Contact>(config, "/api/v1/contacts", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    leads: {
      list: () => request<ListResponse<Lead>>(config, "/api/v1/leads"),
      create: (input: CreateLeadInput) =>
        request<Lead>(config, "/api/v1/leads", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    deals: {
      list: () => request<ListResponse<Deal>>(config, "/api/v1/deals"),
      create: (input: CreateDealInput) =>
        request<Deal>(config, "/api/v1/deals", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    activities: {
      list: () => request<ListResponse<Activity>>(config, "/api/v1/activities"),
      create: (input: CreateActivityInput) =>
        request<Activity>(config, "/api/v1/activities", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    tickets: {
      list: () =>
        request<ListResponse<Ticket>>(config, "/api/v1/helpdesk/tickets"),
      get: (id: string) =>
        request<Ticket>(config, `/api/v1/helpdesk/tickets/${id}`),
      create: (input: CreateTicketInput) =>
        request<Ticket>(config, "/api/v1/helpdesk/tickets", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    employees: {
      list: (params?: { search?: string; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.status) qs.set("status", params.status);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return request<ListResponse<Employee>>(config, `/api/v1/hrm/employees${query}`);
      },
    },
    inventoryProducts: {
      list: (params?: { search?: string; lowStock?: boolean; outOfStock?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.lowStock) qs.set("lowStock", "true");
        if (params?.outOfStock) qs.set("outOfStock", "true");
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return request<ListResponse<InventoryProduct>>(config, `/api/v1/inventory/products${query}`);
      },
    },
    invoices: {
      list: () =>
        request<ListResponse<Invoice>>(config, "/api/v1/invoicing/invoices"),
      create: (input: CreateInvoiceInput) =>
        request<Invoice>(config, "/api/v1/invoicing/invoices", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    projects: {
      list: () => request<ListResponse<Project>>(config, "/api/v1/projects"),
    },
    tasks: {
      list: (input?: ListTasksInput) => {
        const params = input?.projectId
          ? `?projectId=${encodeURIComponent(input.projectId)}`
          : "";
        return request<ListResponse<Task>>(
          config,
          `/api/v1/projects/tasks${params}`,
        );
      },
    },
    notifications: {
      list: (params?: { unreadOnly?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.unreadOnly) qs.set("unreadOnly", "true");
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return request<ListResponse<Notification>>(config, `/api/v1/notifications${query}`);
      },
      markRead: (id: string) =>
        request<Notification>(config, `/api/v1/notifications/${id}/read`, {
          method: "PATCH",
        }),
      markAllRead: () =>
        request<{ success: boolean }>(config, "/api/v1/notifications/read-all", {
          method: "PATCH",
        }),
    },
    fieldServiceJobs: {
      list: (params?: { date?: string }) => {
        const qs = params?.date
          ? `?scheduledStart=${encodeURIComponent(params.date)}`
          : "";
        return request<ListResponse<FieldServiceJob>>(
          config,
          `/api/v1/field-service/jobs${qs}`,
        );
      },
      start: (id: string) =>
        request<FieldServiceJob>(config, `/api/v1/field-service/jobs/${id}/start`, {
          method: "POST",
        }),
      complete: (id: string) =>
        request<FieldServiceJob>(config, `/api/v1/field-service/jobs/${id}/complete`, {
          method: "POST",
        }),
    },
  };
}

export function useCrmClient() {
  const { apiBaseUrl, demoMode, organizationId, authToken } = useMobileConfig();
  return createCrmClient({ apiBaseUrl, demoMode, organizationId, authToken });
}

type AuthApiResult<T> = {
  data: T;
  authToken: string | null;
};

async function authRequest<T>(
  apiBaseUrl: string,
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<AuthApiResult<T>> {
  const response = await fetch(`${cleanBaseUrl(apiBaseUrl)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const rawText = await response.text();
  const data = rawText ? (JSON.parse(rawText) as T) : (null as T);

  if (!response.ok) {
    const message =
      rawText && rawText !== "[object Object]"
        ? rawText
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    data,
    authToken: response.headers.get("set-auth-token"),
  };
}

export async function getAuthSession(
  apiBaseUrl: string,
  token: string,
): Promise<AuthSessionPayload | null> {
  const result = await authRequest<AuthSessionPayload | null>(
    apiBaseUrl,
    "/api/auth/get-session",
    { method: "GET" },
    token,
  );
  return result.data;
}

export async function signInWithEmail(
  apiBaseUrl: string,
  credentials: { email: string; password: string },
) {
  const result = await authRequest<unknown>(
    apiBaseUrl,
    "/api/auth/sign-in/email",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
  );

  if (!result.authToken) {
    throw new Error("No auth token was returned by the server.");
  }

  const session = await getAuthSession(apiBaseUrl, result.authToken);
  return { token: result.authToken, session };
}

export async function signUpWithEmail(
  apiBaseUrl: string,
  payload: { email: string; password: string; name: string },
) {
  const result = await authRequest<unknown>(
    apiBaseUrl,
    "/api/auth/sign-up/email",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!result.authToken) {
    throw new Error("No auth token was returned by the server.");
  }

  const session = await getAuthSession(apiBaseUrl, result.authToken);
  return { token: result.authToken, session };
}

export async function signOutSession(apiBaseUrl: string, token: string) {
  await authRequest(
    apiBaseUrl,
    "/api/auth/sign-out",
    {
      method: "POST",
    },
    token,
  );
}

type SocialAuthStartResponse = {
  redirect: boolean;
  url?: string;
};

function buildMobileAuthBridgeUrl(
  apiBaseUrl: string,
  redirectUri: string,
  mode: "callback" | "error",
) {
  const endpoint =
    mode === "callback"
      ? "/api/mobile/auth/callback"
      : "/api/mobile/auth/error";
  return `${cleanBaseUrl(apiBaseUrl)}${endpoint}?redirect_uri=${encodeURIComponent(
    redirectUri,
  )}`;
}

function getSocialAuthError(url: URL) {
  const error = url.searchParams.get("error");
  if (!error) return null;

  const description = url.searchParams.get("error_description");
  return description ? `${error}: ${description}` : error;
}

export async function signInWithSocial(
  apiBaseUrl: string,
  provider: SocialProvider,
) {
  const redirectUri = Linking.createURL("/auth/callback");
  const callbackURL = buildMobileAuthBridgeUrl(
    apiBaseUrl,
    redirectUri,
    "callback",
  );
  const errorCallbackURL = buildMobileAuthBridgeUrl(
    apiBaseUrl,
    redirectUri,
    "error",
  );

  const start = await authRequest<SocialAuthStartResponse>(
    apiBaseUrl,
    "/api/auth/sign-in/social",
    {
      method: "POST",
      body: JSON.stringify({
        provider,
        callbackURL,
        errorCallbackURL,
        disableRedirect: true,
      }),
    },
  );

  if (!start.data.url) {
    throw new Error("The social login flow did not return a redirect URL.");
  }

  const result = await WebBrowser.openAuthSessionAsync(
    start.data.url,
    redirectUri,
  );

  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new Error(
      result.type === "cancel"
        ? "Social sign-in was cancelled."
        : "Social sign-in did not complete.",
    );
  }

  const callbackResult = new URL(result.url);
  const authError = getSocialAuthError(callbackResult);
  if (authError) {
    throw new Error(authError);
  }

  const token = callbackResult.searchParams.get("token");
  if (!token) {
    throw new Error("No auth token was returned by the social login flow.");
  }

  const session = await getAuthSession(apiBaseUrl, token);
  return { token, session };
}
