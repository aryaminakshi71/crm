export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'lead' | 'customer';
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  value?: number;
  createdAt: string;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: 'prospecting' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  contactId?: string;
  contactName?: string;
  closeDate?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  startDate?: string;
  endDate?: string;
  teamSize?: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalContacts: number;
  totalLeads: number;
  totalDeals: number;
  dealsValue: number;
  totalProjects: number;
  activeProjects: number;
  totalEmployees: number;
  pendingLeaveRequests: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  slaMinutes?: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FieldJob {
  id: string;
  jobNumber: string;
  customerName: string;
  address: string;
  scheduledTime: string;
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed';
  notes?: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: 'Email' | 'SMS' | 'Social' | 'Ads';
  status: 'draft' | 'active' | 'paused' | 'completed';
  sentCount: number;
  openRate: number;
  clickRate: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  runsCount: number;
}

export interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  channel: 'sms' | 'voice' | 'chat';
}

export interface SocialPost {
  id: string;
  platform: 'Twitter' | 'LinkedIn' | 'Instagram' | 'Facebook';
  content: string;
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed';
}