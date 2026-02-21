# CRM

A modern Customer Relationship Management system built for teams to manage contacts, deals, and customer interactions.

## ✨ Features

- Contact management
- Deal pipeline tracking
- Task and activity management
- Email integration
- Analytics and reporting
- Multi-user collaboration
- Custom fields and workflows
- API access

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ or Bun 1.3+
- PostgreSQL database
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/aryaminakshi71/crm.git
cd crm

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## 📚 Tech Stack

- **Frontend**: React with TanStack Router
- **Backend**: Hono API with oRPC (Cloudflare Workers)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Storage**: Cloudflare R2
- **Caching**: Cloudflare KV
- **Deployment**: Cloudflare Pages + Workers
- **Package Manager**: Bun

## 🏗️ Project Structure

```
crm/
├── apps/
│   ├── web/          # Frontend application
│   └── api/          # Backend API (Cloudflare Workers)
├── packages/         # Shared packages
│   ├── auth/         # Authentication package
│   ├── storage/      # Database package
│   ├── core/         # Core utilities
│   └── logger/       # Logging package
└── ...
```

## 🔧 Development

```bash
# Run development server
bun run dev

# Run type checking
bun run typecheck

# Run linter
bun run lint

# Format code
bun run format

# Run database migrations
bun run db:migrate

# Open database studio
bun run db:studio
```

## 📦 Deployment

### Cloudflare Pages (Frontend)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `bun run build --filter=crm-web`
   - Output directory: `apps/web/dist`
3. Add environment variables in Cloudflare dashboard

### Cloudflare Workers (Backend)

The API is automatically deployed via GitHub Actions when you push to `main` branch.

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API uses:
- Cloudflare R2 for file storage
- Cloudflare KV for caching
- Hyperdrive for PostgreSQL connection

## 📝 Environment Variables

See `.env.example` for required environment variables.

**Important:** The app supports demo mode via `x-demo-mode` header for testing purposes. When demo mode is enabled, a mock authentication context is created with a demo user. This is intentional for demonstration purposes and uses a placeholder token (`demo-token`) that should not be used in production.

## 🧪 Testing

```bash
# Run E2E tests
bun run test:links

# Run E2E tests with UI
bun run test:links:ui
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/aryaminakshi71/crm)
- [Documentation](https://github.com/aryaminakshi71/crm/wiki)

## 👤 Author

Arya Labs

---

Made with ❤️ by Arya Labs
