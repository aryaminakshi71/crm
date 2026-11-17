# DevMind - Agentic AI Coding SaaS Platform

## 1. Project Overview

**Project Name:** DevMind  
**Type:** SaaS Web Application  
**Core Functionality:** A multi-agent AI coding platform where users can create, configure, and use AI coding agents for code generation, debugging, code review, and refactoring tasks.  
**Target Users:** Software developers, development teams, and CTOs looking to automate coding tasks.

---

## 2. Tech Stack

- **Framework:** TanStack Start (React 19 + TanStack Router)
- **Runtime:** Cloudflare Workers (Edge deployment)
- **Database:** Drizzle ORM + Cloudflare D1 (SQLite)
- **Auth:** Better Auth
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **State:** TanStack Query
- **API:** oRPC (type-safe APIs)
- **LLM Integration:** OpenAI / Anthropic / Ollama compatible

---

## 3. UI/UX Specification

### 3.1 Layout Structure

**App Shell:**
- Collapsible sidebar (280px expanded, 64px collapsed)
- Top navigation bar (64px height)
- Main content area with max-width 1400px

**Responsive Breakpoints:**
- Mobile: < 768px (sidebar hidden, hamburger menu)
- Tablet: 768px - 1024px (sidebar collapsed by default)
- Desktop: > 1024px (sidebar expanded)

### 3.2 Visual Design

**Color Palette:**
```css
--background: #0a0a0b
--foreground: #fafafa
--card: #121214
--card-foreground: #fafafa
--primary: #8b5cf6 (violet-500)
--primary-foreground: #ffffff
--secondary: #27272a
--secondary-foreground: #fafafa
--muted: #27272a
--muted-foreground: #a1a1aa
--accent: #f4f4f5
--accent-foreground: #18181b
--destructive: #ef4444
--border: #27272a
--ring: #8b5cf6
--success: #22c55e
--warning: #f59e0b
```

**Typography:**
- Headings: "Figtree Variable" (font-weight: 600-700)
- Body: "Figtree Variable" (font-weight: 400-500)
- Code: "JetBrains Mono"

**Spacing System:** 4px base unit (0.25rem increments)

**Visual Effects:**
- Card shadows: `0 4px 24px rgba(0, 0, 0, 0.4)`
- Hover transitions: 150ms ease-out
- Subtle gradient overlays on hero sections
- Glow effects on primary buttons: `box-shadow: 0 0 20px rgba(139, 92, 246, 0.3)`

### 3.3 Pages & Components

**1. Landing Page (Public)**
- Hero section with animated gradient background
- Feature cards with hover lift effect
- Pricing tiers display
- CTA buttons with glow effect

**2. Auth Pages (Public)**
- Clean centered card design
- Email/password form
- Social auth buttons (GitHub, Google)
- Animated background pattern

**3. Dashboard (Authenticated)**
- Usage stats cards (API calls, tokens, active agents)
- Recent activity feed
- Quick action buttons
- Usage chart (last 7 days)

**4. Agents Page (Authenticated)**
- Agent cards grid (3 columns desktop, 2 tablet, 1 mobile)
- Agent creation button (floating action)
- Search and filter bar
- Agent status indicators (active, paused, error)

**5. Agent Detail/Editor (Authenticated)**
- Split panel layout (config left, preview right)
- Configuration form:
  - Name & description
  - System prompt editor
  - Model selection (dropdown)
  - Temperature, max tokens sliders
  - Tools enabled (checkboxes)
- Code execution playground
- Real-time streaming response

**6. Pricing Page (Public)**
- 3-tier pricing cards
- Feature comparison table
- FAQ accordion

---

## 4. Database Schema

### Users Table
- id (uuid, primary)
- email (string, unique)
- name (string, nullable)
- avatar_url (string, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### Subscription Table
- id (uuid, primary)
- user_id (uuid, foreign)
- plan (enum: free, pro, enterprise)
- status (enum: active, cancelled, past_due)
- stripe_customer_id (string, nullable)
- stripe_subscription_id (string, nullable)
- current_period_end (timestamp)

### Agents Table
- id (uuid, primary)
- user_id (uuid, foreign)
- name (string)
- description (text, nullable)
- system_prompt (text)
- model (string) - e.g., "gpt-4", "claude-3"
- temperature (float, default 0.7)
- max_tokens (int, default 4096)
- tools (jsonb) - array of enabled tools
- status (enum: active, paused)
- created_at (timestamp)
- updated_at (timestamp)

### Conversations Table
- id (uuid, primary)
- agent_id (uuid, foreign)
- user_id (uuid, foreign)
- title (string)
- created_at (timestamp)

### Messages Table
- id (uuid, primary)
- conversation_id (uuid, foreign)
- role (enum: user, assistant)
- content (text)
- tokens_used (int, nullable)
- model (string, nullable)
- created_at (timestamp)

### Usage Table
- id (uuid, primary)
- user_id (uuid, foreign)
- agent_id (uuid, nullable)
- tokens_used (int)
- api_calls (int)
- cost (decimal)
- period_start (timestamp)
- period_end (timestamp)

---

## 5. Core Features

### F1: User Authentication
- Email/password signup & login
- GitHub OAuth integration
- Password reset flow
- Session management with JWT

### F2: Agent Management
- Create new agents with custom prompts
- Configure model parameters
- Enable/disable tools per agent
- Clone existing agents
- Delete agents (with confirmation)

### F3: Agent Execution Playground
- Chat interface with streaming responses
- Code syntax highlighting
- Copy code button
- Save as snippet
- Export conversation

### F4: Tools Integration
- Web search
- Code execution (sandboxed)
- File system operations
- Git operations
- Database queries

### F5: Usage Tracking
- Real-time token counting
- Cost estimation per conversation
- Daily/weekly/monthly usage charts
- Usage alerts and limits

### F6: Subscription Management
- Free tier (1000 tokens/month)
- Pro tier ($29/month - 50,000 tokens)
- Enterprise tier (custom pricing)
- Usage-based billing option
- Upgrade/downgrade flow

---

## 6. API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - List user's agents
- `POST /api/agents` - Create agent
- `GET /api/agents/:id` - Get agent details
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/execute` - Execute agent

### Conversations
- `GET /api/agents/:id/conversations` - List conversations
- `POST /api/agents/:id/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send message

### Usage
- `GET /api/usage` - Get usage stats
- `GET /api/usage/history` - Get usage history

---

## 7. Acceptance Criteria

### Authentication
- [ ] User can sign up with email/password
- [ ] User can log in and see dashboard
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes

### Agents
- [ ] User can view list of their agents
- [ ] User can create a new agent with custom prompt
- [ ] User can edit agent configuration
- [ ] User can delete an agent
- [ ] Agent cards show status indicators

### Execution
- [ ] User can send messages to an agent
- [ ] Responses stream in real-time
- [ ] Code blocks have syntax highlighting
- [ ] User can copy code from responses

### Dashboard
- [ ] Dashboard shows usage statistics
- [ ] Recent conversations are displayed
- [ ] Quick actions are available

### UI/UX
- [ ] Dark theme is applied correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Animations are smooth (60fps)
- [ ] Loading states are shown appropriately

---

## 8. File Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── agents/       # Agent-specific components
│   ├── layout/       # Layout components (Sidebar, Header)
│   └── auth/         # Auth-related components
├── routes/           # TanStack Router routes
├── server/
│   ├── api/          # API route handlers
│   ├── db/           # Database schema & queries
│   └── services/     # Business logic services
├── lib/              # Utility functions
└── styles/           # Global styles
```
