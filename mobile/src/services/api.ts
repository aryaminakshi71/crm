import * as SecureStore from 'expo-secure-store';
import { AuthTokens, User, Contact, Lead, Deal, Employee, LeaveRequest, Project, Task, Notification, DashboardStats, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8787';

class ApiService {
  private tokens: AuthTokens | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (accessToken) {
        this.tokens = { accessToken, refreshToken: refreshToken || undefined };
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  async saveTokens(tokens: AuthTokens) {
    this.tokens = tokens;
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    }
  }

  async clearTokens() {
    this.tokens = null;
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  getToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.saveTokens(response.data.tokens);
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await this.saveTokens(response.data.tokens);
    return response.data;
  }

  async logout() {
    await this.clearTokens();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/auth/me');
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>('/dashboard/stats');
    return response.data;
  }

  // CRM - Contacts
  async getContacts(): Promise<Contact[]> {
    const response = await this.request<Contact[]>('/crm/contacts');
    return response.data;
  }

  async getContact(id: string): Promise<Contact> {
    const response = await this.request<Contact>(`/crm/contacts/${id}`);
    return response.data;
  }

  // CRM - Leads
  async getLeads(): Promise<Lead[]> {
    const response = await this.request<Lead[]>('/crm/leads');
    return response.data;
  }

  async getLead(id: string): Promise<Lead> {
    const response = await this.request<Lead>(`/crm/leads/${id}`);
    return response.data;
  }

  // CRM - Deals
  async getDeals(): Promise<Deal[]> {
    const response = await this.request<Deal[]>('/crm/deals');
    return response.data;
  }

  async getDeal(id: string): Promise<Deal> {
    const response = await this.request<Deal>(`/crm/deals/${id}`);
    return response.data;
  }

  // HRM - Employees
  async getEmployees(): Promise<Employee[]> {
    const response = await this.request<Employee[]>('/hrm/employees');
    return response.data;
  }

  async getEmployee(id: string): Promise<Employee> {
    const response = await this.request<Employee>(`/hrm/employees/${id}`);
    return response.data;
  }

  // HRM - Leave
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const response = await this.request<LeaveRequest[]>('/hrm/leave');
    return response.data;
  }

  async createLeaveRequest(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const response = await this.request<LeaveRequest>('/hrm/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await this.request<Project[]>('/projects');
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.request<Project>(`/projects/${id}`);
    return response.data;
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const response = await this.request<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await this.request<Notification[]>('/notifications');
    return response.data;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'POST' });
  }
}

export const api = new ApiService();