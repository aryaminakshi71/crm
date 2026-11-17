import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  model: text('model').default('gpt-4'),
  avatarUrl: text('avatar_url'),
  systemPrompt: text('system_prompt'),
  tools: text('tools', { mode: 'json' }).$type<string[]>().default([]),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  configuration: text('configuration', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCalls: text('tool_calls', { mode: 'json' }),
  toolCallId: text('tool_call_id'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull(),
  input: text('input', { mode: 'json' }).notNull(),
  output: text('output', { mode: 'json' }),
  error: text('error'),
  logs: text('logs', { mode: 'json' }).$type<string[]>().default([]),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const agentTemplates = sqliteTable('agent_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  avatarUrl: text('avatar_url'),
  systemPrompt: text('system_prompt').notNull(),
  tools: text('tools', { mode: 'json' }).$type<string[]>().default([]),
  configuration: text('configuration', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  category: text('category'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  usageCount: integer('usage_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
