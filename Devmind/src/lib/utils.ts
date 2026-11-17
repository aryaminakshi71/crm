import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export const AGENT_TYPES = [
  { value: 'chatbot', label: 'Chatbot', description: 'Conversational agent for Q&A and support' },
  { value: 'autonomous', label: 'Autonomous', description: 'Self-directed agent that executes tasks' },
  { value: 'code_execution', label: 'Code Execution', description: 'Writes and executes code' },
  { value: 'data_analysis', label: 'Data Analysis', description: 'Analyzes data and generates insights' },
] as const;

export const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
] as const;

export const TOOLS = [
  { value: 'web_search', label: 'Web Search', description: 'Search the web for information' },
  { value: 'code_execution', label: 'Code Execution', description: 'Run code in a sandboxed environment' },
  { value: 'file_read', label: 'File Read', description: 'Read files from the filesystem' },
  { value: 'file_write', label: 'File Write', description: 'Write files to the filesystem' },
  { value: 'bash', label: 'Bash', description: 'Execute bash commands' },
] as const;
