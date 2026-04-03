# Design Studio - AI-Powered Design System Generator

Design Studio is a full-stack platform that uses Claude (via Bedrock) to automatically generate production-ready React components from design inputs (Figma, URLs, or text prompts).

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm
- Docker & Docker Compose
- AWS Account (for deployment)

### Local Development

```bash
# 1. Clone and setup
git clone <repo>
cd up-design-flow-automation

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start local services (DynamoDB)
pnpm run dev:local

# 4. In another terminal, start the frontend
cd apps/web
pnpm dev

# 5. In another terminal, start the API (SAM)
cd apps/api
pnpm dev
```

Access:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **DynamoDB Admin**: http://localhost:8000/shell

## Architecture

```
Design Studio (Monorepo)
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── components/       # 18 UI components
│   │   ├── app/              # Routes (auth, dashboard, studio, etc.)
│   │   └── lib/              # API client, utilities
│   │
│   └── api/                  # Lambda backends
│       ├── src/handlers/     # 7 Lambda handlers
│       ├── src/utils/        # JWT, responses
│       └── template.yaml     # SAM template
│
├── packages/
│   ├── types/                # Shared TypeScript interfaces
│   │   └── src/index.ts      # User, Project, Idea, Iteration, etc.
│   │
│   └── db/                   # Database layer
│       ├── src/client.ts     # DynamoDB client factory
│       └── src/repositories/ # Users, Projects, Ideas, etc.
│
├── infra/                    # AWS CDK infrastructure
│   ├── lib/stacks/           # Database, API, Frontend, Budget
│   └── bin/app.ts            # CDK entrypoint
│
└── .github/workflows/        # CI/CD
    ├── pr-checks.yml         # Lint, test, build
    ├── deploy.yml            # Deploy to AWS
    └── destroy.yml           # Teardown infrastructure
```

## Key Components

### Frontend (apps/web)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS Custom Properties
- **Components**: 18 production-ready UI components
- **Pages**: Auth (login/register), Dashboard, Projects, Studio, Gallery, Settings
- **Type Safety**: 100% TypeScript strict mode

### API (apps/api)
- **Runtime**: Node.js 20 on AWS Lambda
- **Database**: DynamoDB with GSI1 for reverse lookups
- **Endpoints**:
  - Auth: register, login, session validation
  - Projects: CRUD + Figma connections
  - Ideas: CRUD from 3 sources (Figma/URL/Prompt)
  - Gallery: promote to production
  - Bedrock: invoke Claude agents
  - GitHub: PR creation, webhook handling
  - Publish: CodeArtifact publishing

### Database (packages/db)
- **Pattern**: Repository pattern for type-safe queries
- **Schema**: PK/SK + GSI1 for all entities
- **Entities**:
  - User (email lookup via GSI1)
  - Project (creator lookup)
  - Idea (project + creator lookups)
  - Iteration (nested under Idea)
  - Promotion (status tracking)
  - FigmaConnection (per-project)

### Infrastructure (infra)
- **IaC**: AWS CDK in TypeScript
- **Stacks**:
  - Database: DynamoDB with PITR + streams
  - API: Lambda + API Gateway + IAM roles
  - Frontend: S3 + CloudFront + TLS
  - Budget: Spend alerts + concurrency caps

## Development Workflow

### Add a new component
```bash
cd apps/web/components/ui
# Create component.tsx, component.types.ts
# Update components/ui/index.ts to export
```

### Extend the API
```bash
cd apps/api/src/handlers
# Add new handler, import in index.ts router
```

### Deploy to AWS
```bash
# One-time setup
export AWS_ACCOUNT_ID=<your-id>
export AWS_REGION=us-east-1
export ALERT_EMAIL=you@example.com

# Deploy
git push main
# GitHub Actions automatically deploys via CDK
```

## Environment Variables

**Local Development** (.env.local):
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=design-studio-local
JWT_SECRET=dev-secret-key-do-not-use-in-production
```

**AWS Deployment** (GitHub Secrets):
```
AWS_ACCOUNT_ID
AWS_REGION
AWS_ACCESS_KEY_ID (CI deploy role)
AWS_SECRET_ACCESS_KEY
ALERT_EMAIL (budget alerts)
GITHUB_APP_ID (for PR creation)
GITHUB_APP_PRIVATE_KEY
```

## Agents (Bedrock)

### Design Importer
- Input: Figma metadata + images, scraped HTML, or freeform prompt
- Output: ComponentSpec (normalized design specification)
- System Prompt: `packages/prompts/design-importer.txt`

### Component Builder
- Input: ComponentSpec + iteration prompt + history
- Output: 4 files (component, types, stories, docs)
- System Prompt: `packages/prompts/component-builder.txt`

## Testing

```bash
# Unit tests (Vitest)
pnpm test

# Type checking (strict mode)
pnpm typecheck

# E2E tests (Playwright)
cd apps/web && pnpm test:e2e

# Linting
pnpm lint
```

## Deployment

### Development (Dev environment)
```bash
git push develop
# Triggers pr-checks.yml for PRs
# No auto-deploy
```

### Production (Prod environment)
```bash
git push main
# Triggers deploy.yml
# Auto-deploys to AWS via CDK
```

### Manual Teardown
```bash
# Destroy dev infrastructure
gh workflow run destroy.yml -f environment=dev
```

## Performance & Costs

- **DynamoDB**: Pay-per-request billing (~$0-3/month at low usage)
- **Lambda**: 512MB, 30s timeout, max 10 concurrent (~$1-5/month)
- **S3 + CloudFront**: ~$1-2/month
- **Bedrock**: Variable based on usage (budget cap: $50/month dev, $100/month prod)

**Total baseline: ~$5-8/month at near-zero usage**

## Status

### Completed ✅
- [x] 18 frontend UI components
- [x] 6 dashboard pages with AppShell
- [x] Local development setup (Docker + DynamoDB)
- [x] Database layer (types + repositories)
- [x] 7 Lambda handlers (all endpoints)
- [x] CDK infrastructure stacks
- [x] GitHub Actions CI/CD

### In Progress 🚧
- [ ] Frontend-to-API integration
- [ ] Bedrock agent prompts & invocation
- [ ] E2E tests
- [ ] API documentation (OpenAPI)

### Planned 📋
- [ ] GitHub OAuth flow
- [ ] GitHub PR creation
- [ ] CodeArtifact publishing
- [ ] Figma OAuth integration
- [ ] Design importer agent
- [ ] Component builder agent

## Documentation

- [LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md) - Local development guide
- [docs/DESIGN_STUDIO_FRONTEND_SPEC.md](docs/DESIGN_STUDIO_FRONTEND_SPEC.md) - Frontend component specs
- [docs/DESIGN_STUDIO_ARCHITECTURE.md](docs/DESIGN_STUDIO_ARCHITECTURE.md) - Full system architecture
- [SCAFFOLD_COMPLETE.md](SCAFFOLD_COMPLETE.md) - Completion checklist

## Support

For issues or questions:
1. Check the documentation above
2. Review GitHub Issues
3. Check GitHub Discussions

## License

[LICENSE](LICENSE)
