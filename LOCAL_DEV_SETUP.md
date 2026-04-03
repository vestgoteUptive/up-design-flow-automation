# Local Development Setup

This project uses Docker Compose to run a local development environment with DynamoDB.

## Prerequisites

- **Docker** (and Docker Compose)
- **Node.js 20+** with pnpm
- **.env.local** file (copy from `.env.example`)

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env.local

# 2. Start local services (DynamoDB)
pnpm run dev:local

# 3. In another terminal, start the frontend
cd apps/web
pnpm dev

# 4. Open http://localhost:3000
```

The local environment is now running:
- **Frontend**: http://localhost:3000
- **Local DynamoDB**: http://localhost:8000 (admin UI at http://localhost:8000/shell)
- **Backend API**: Will be at http://localhost:3001 (once Lambda handlers are built)

## Services

### DynamoDB Local (port 8000)

In-memory DynamoDB instance with automatic table creation. Data persists across restarts in the `dynamodb-data` volume.

**Access the admin UI:**
```bash
# Once started, navigate to:
http://localhost:8000/shell
```

**Query examples:**
```bash
# List tables
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

## Environment Variables

Required environment variables are defined in `.env.local`:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=design-studio-local
JWT_SECRET=dev-secret-key-do-not-use-in-production
```

## Stopping Local Services

```bash
pnpm run dev:down
```

This stops and removes containers but preserves the DynamoDB data volume.

## Troubleshooting

### DynamoDB won't start

```bash
# Check Docker is running
docker ps

# View logs
docker logs design-studio-dynamodb

# Force rebuild
docker-compose down -v
docker-compose up -d
```

### Connection refused errors

Ensure:
1. `DYNAMODB_ENDPOINT=http://localhost:8000` in `.env.local`
2. Docker container is healthy: `docker ps` should show container status as "Up"
3. Wait 5-10 seconds after `docker-compose up` before running setup scripts

### Table already exists

If you see "ResourceInUseException", the table exists. You can safely ignore or run:

```bash
aws dynamodb delete-table \
  --table-name design-studio-local \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

## Development Workflow

1. Make code changes in `packages/db` or `apps/api`
2. Run local tests: `pnpm test`
3. Verify with local DynamoDB: `pnpm run setup:local`
4. Commit when satisfied

When pushed to `main`, GitHub Actions automatically deploys to AWS via CDK.

## Architecture

```
Local Dev Machine
├── Docker
│   └── DynamoDB Local :8000
│       └── design-studio-local table
│
├── Node.js
│   ├── Frontend (Next.js) :3000
│   └── Backend (Lambda/Node) :3001 (future)
│
└── .env.local (local AWS credentials)
```

No real AWS credentials needed for local development. Optional for Bedrock agent testing.
