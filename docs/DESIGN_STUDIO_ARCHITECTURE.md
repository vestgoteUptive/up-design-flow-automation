# Design Studio — Architecture & Agentic Development Brief

## Purpose

Design Studio is an internal web platform that enables designers and developers to convert design
ideas — from Figma components, website URLs, or plain text prompts — into production-ready
shadcn/ui TypeScript React components. Components flow through a structured pipeline: input →
enrich → generate → review → build → publish. The platform auto-opens GitHub PRs with generated
component code and Storybook stories, and publishes approved components to AWS CodeArtifact as a
scoped npm package.

---

## Coding Style & Conventions

- **Language:** TypeScript everywhere. No `any`. Strict mode enabled.
- **Frontend:** Next.js 14 App Router, Tailwind CSS, shadcn/ui components
- **Backend:** AWS Lambda functions (Node.js 20.x), API Gateway HTTP API
- **IaC:** AWS CDK v2 in TypeScript. All infrastructure defined in `/infra`
- **Database:** DynamoDB (AWS SDK v3 DocumentClient, no ORM — typed repository pattern)
- **Testing:** Vitest for unit/integration. Playwright for e2e. Every function, every route, every
  component must have tests. No untested code is merged.
- **Linting:** ESLint + Prettier. No warnings allowed on merge.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `infra:`, `test:`)
- **Branching:** Feature branches off `main`. PRs required. Auto-deploy on merge to `main`.

---

## Repository Structure

```
design-studio/
├── apps/
│   ├── web/                        # Next.js frontend (static export → S3/CloudFront)
│   │   ├── app/                    # App Router pages and layouts
│   │   │   ├── (auth)/             # Login, register
│   │   │   ├── (studio)/           # Studio input, generate, iterate
│   │   │   ├── (gallery)/          # Reviewed ideas gallery
│   │   │   └── (projects)/         # Project settings, creation
│   │   ├── components/             # Shared UI components
│   │   ├── lib/                    # API client, auth helpers, utils
│   │   └── __tests__/              # Vitest + Playwright tests
│   │
│   └── api/                        # Lambda functions (one per route group)
│       ├── auth/                   # Register, login, session
│       ├── projects/               # CRUD, settings, Figma connections
│       ├── ideas/                  # Studio sessions, iterations, status
│       ├── gallery/                # Reviewed ideas, promote action
│       ├── agents/                 # Bedrock invocation, prompt assembly
│       ├── github/                 # GitHub App webhook, PR creation
│       └── publish/                # CodeArtifact publish, verification
│
├── packages/
│   └── db/                         # DynamoDB typed repository layer
│       └── src/
│           ├── client.ts            # DynamoDB DocumentClient singleton
│           ├── types.ts             # All entity types (User, Project, Idea etc.)
│           └── repositories/
│               ├── users.ts
│               ├── projects.ts
│               ├── ideas.ts
│               ├── iterations.ts
│               └── promotions.ts
│
├── infra/                          # AWS CDK v2 TypeScript
│   ├── bin/
│   │   └── app.ts                  # CDK app entry
│   └── lib/
│       ├── stacks/
│       │   ├── database-stack.ts   # DynamoDB tables + GSIs
│       │   ├── api-stack.ts        # Lambda + API Gateway
│       │   ├── frontend-stack.ts   # S3 + CloudFront
│       │   ├── secrets-stack.ts    # Secrets Manager entries
│       │   └── budget-stack.ts     # AWS Budgets + Bedrock spend cap
│       └── constructs/
│           ├── lambda-function.ts  # Reusable Lambda construct
│           └── bedrock-agent.ts    # Bedrock model invocation construct
│
├── .github/
│   └── workflows/
│       ├── deploy.yml              # Deploy on merge to main
│       ├── pr-checks.yml           # Lint, type-check, test on PR
│       └── destroy.yml             # Manual workflow to tear down
│
├── AGENTS.md                       # This file — agentic development instructions
├── package.json                    # Root workspace (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo build pipeline
└── tsconfig.base.json
```

---

## Data Model (DynamoDB — single-table design)

One table per entity. No joins — data is denormalized and co-located by access pattern.
All items use `PK` / `SK` as the primary key. GSIs enable reverse lookups.

### Table: `design-studio`

| Entity | PK | SK | GSI1PK | GSI1SK |
|---|---|---|---|---|
| User | `USER#<id>` | `#PROFILE` | `EMAIL#<email>` | `#PROFILE` |
| Project | `PROJECT#<id>` | `#META` | `TYPE#PROJECT` | `createdAt` |
| ProjectMember | `PROJECT#<id>` | `MEMBER#<userId>` | `USER#<userId>` | `PROJECT#<id>` |
| FigmaConnection | `PROJECT#<id>` | `FIGMA#<id>` | — | — |
| Idea | `PROJECT#<id>` | `IDEA#<id>` | `USER#<userId>` | `IDEA#<id>` |
| Iteration | `IDEA#<id>` | `ITER#<id>` | — | — |
| Promotion | `IDEA#<id>` | `#PROMOTION` | `TYPE#PROMOTION` | `status` |

### TypeScript entity types

```typescript
// packages/db/src/types.ts

export type SourceType = 'FIGMA' | 'URL' | 'PROMPT'
export type IdeaStatus = 'DRAFT' | 'REVIEWED'
export type PromotionStatus = 'BUILDING' | 'PR_OPEN' | 'VERIFIED' | 'PUBLISHED' | 'FAILED'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string // ISO 8601
}

export interface Project {
  id: string
  name: string
  description?: string
  creatorId: string
  agentInstructions?: string
  githubRepoUrl?: string
  githubBranch: string
  githubAppInstallId?: string
  createdAt: string
}

export interface FigmaConnection {
  id: string
  projectId: string
  displayName: string
  fileKey: string
  tokenArn: string // Secrets Manager ARN — token never stored in DynamoDB
}

export interface Idea {
  id: string
  projectId: string
  createdById: string
  createdByName: string // denormalized for display
  sourceType: SourceType
  sourceData: FigmaSource | UrlSource | PromptSource
  userPrompt?: string
  status: IdeaStatus
  createdAt: string
  updatedAt: string
}

export interface FigmaSource {
  type: 'FIGMA'
  connectionId: string
  nodeIds: string[]        // selected component or group node IDs
  componentNames: string[]
}

export interface UrlSource {
  type: 'URL'
  url: string
  scrapedData?: string    // normalized output from importer agent
}

export interface PromptSource {
  type: 'PROMPT'
  text: string
}

export interface Iteration {
  id: string
  ideaId: string
  prompt: string
  generatedCode: string   // full component code from Bedrock
  previewUrl?: string     // S3 pre-signed URL of rendered snapshot
  createdAt: string
}

export interface Promotion {
  id: string
  ideaId: string
  promotedById: string
  promotedByName: string  // denormalized
  status: PromotionStatus
  prUrl?: string
  prNumber?: number
  publishedAt?: string
  createdAt: string
}
```

### Repository pattern (no raw SDK calls in Lambda handlers)

```typescript
// packages/db/src/repositories/ideas.ts
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { Idea } from '../types'

const TABLE = process.env.DYNAMODB_TABLE!

export async function getIdeasByProject(
  client: DynamoDBDocumentClient,
  projectId: string
): Promise<Idea[]> {
  const result = await client.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `PROJECT#${projectId}`,
      ':sk': 'IDEA#',
    },
  }))
  return (result.Items ?? []) as Idea[]
}

export async function putIdea(
  client: DynamoDBDocumentClient,
  idea: Idea
): Promise<void> {
  await client.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `PROJECT#${idea.projectId}`,
      SK: `IDEA#${idea.id}`,
      GSI1PK: `USER#${idea.createdById}`,
      GSI1SK: `IDEA#${idea.id}`,
      ...idea,
    },
  }))
}
```



---

## AWS Infrastructure (CDK)

### Stacks and cost profile

| Stack | Resources | Est. monthly cost |
|---|---|---|
| `DatabaseStack` | DynamoDB table + GSIs (on-demand billing) | ~$0–3 at low usage |
| `ApiStack` | Lambda (128MB), API Gateway HTTP | Pay per request |
| `FrontendStack` | S3 + CloudFront | ~$1–2 |
| `SecretsStack` | Secrets Manager (5 secrets) | ~$2.50 |
| `BudgetStack` | AWS Budgets alert + Lambda concurrency cap | $0 |

**Total baseline: ~$5–8/month at near-zero usage**
No VPC needed — DynamoDB and Lambda communicate via AWS service endpoints.

### DynamoDB CDK construct

```typescript
// infra/lib/stacks/database-stack.ts
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

const table = new dynamodb.Table(this, 'DesignStudioTable', {
  tableName: 'design-studio',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode:  dynamodb.BillingMode.PAY_PER_REQUEST, // no idle cost
  pointInTimeRecovery: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
})

// GSI for reverse lookups (email → user, user → ideas, status → promotions)
table.addGlobalSecondaryIndex({
  indexName: 'GSI1',
  partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
})
```

### Bedrock spend cap

```typescript
// infra/lib/stacks/budget-stack.ts
new budgets.CfnBudget(this, 'BedrockBudget', {
  budget: {
    budgetType: 'COST',
    timeUnit: 'MONTHLY',
    budgetLimit: { amount: 50, unit: 'USD' },
    costFilters: { Service: ['Amazon Bedrock'] },
  },
  notificationsWithSubscribers: [{
    notification: {
      notificationType: 'ACTUAL',
      comparisonOperator: 'GREATER_THAN',
      threshold: 80, // alert at 80% of cap
    },
    subscribers: [{ subscriptionType: 'EMAIL', address: process.env.ALERT_EMAIL! }],
  }],
})

// Lambda reserved concurrency cap on agent invoker
agentLambda.addAutoScaling({ maxCapacity: 5 })
```

---

## GitHub Actions

### Secrets required (stored in GitHub repository secrets)

```
AWS_ACCOUNT_ID
AWS_REGION
AWS_ACCESS_KEY_ID          # CI deploy role
AWS_SECRET_ACCESS_KEY      # CI deploy role
GITHUB_APP_ID              # GitHub App for PR creation
GITHUB_APP_PRIVATE_KEY     # GitHub App private key
ALERT_EMAIL                # Budget alert recipient
```

### `deploy.yml` — triggered on merge to main

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }

      - run: pnpm install --frozen-lockfile

      - name: Type check + test
        run: pnpm turbo typecheck test

      - name: Build frontend
        run: pnpm turbo build --filter=web

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: CDK deploy
        run: pnpm --filter=infra cdk deploy --all --require-approval never
        env:
          AWS_ACCOUNT_ID: ${{ secrets.AWS_ACCOUNT_ID }}
          ALERT_EMAIL: ${{ secrets.ALERT_EMAIL }}

      - name: Sync frontend to S3
        run: |
          aws s3 sync apps/web/out s3://${{ steps.cdk.outputs.bucket }} --delete
          aws cloudfront create-invalidation \
            --distribution-id ${{ steps.cdk.outputs.distributionId }} \
            --paths "/*"
```

### `pr-checks.yml` — triggered on every PR

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck test
      - name: Check for untested exports
        run: pnpm turbo coverage -- --reporter=text --coverage.thresholds.lines=80
```

---

## Agent Architecture

### Two agents, invoked via AWS Bedrock (Claude claude-sonnet-4-20250514)

---

### Agent 1 — Design Importer

**Purpose:** Normalize any input source into a structured `ComponentSpec` JSON that the
Component Builder agent can consume regardless of where the input came from.

**Input variants:**
- Figma: node metadata + rendered image URLs + variant matrix
- URL: scraped HTML/CSS + extracted color palette + typography stack
- Prompt: raw user text

**Output:** `ComponentSpec` JSON (see Data Model section)

**System prompt:** Base prompt hardcoded in Lambda. Project-specific instructions
appended from `project.agentInstructions` if set.

---

### Agent 2 — Component Builder

**Purpose:** Generate a complete, production-ready shadcn/ui component from a
`ComponentSpec`. Every output must be immediately usable by a developer with no
manual editing required.

**Input:** `ComponentSpec` + user enrichment prompt + full iteration history

**Output — four files, always:**

```
ComponentName.tsx           Main component implementation
ComponentName.types.ts      All TypeScript interfaces and types
ComponentName.stories.tsx   Storybook stories
ComponentName.docs.mdx      Human-readable documentation
```

---

### Component Documentation Standard

This is a non-negotiable output requirement. Every generated component must include
a `ComponentName.docs.mdx` file. This file is what a developer, designer, or non-technical
stakeholder reads to understand the component. It must be written so that someone who has
never seen the component before understands it fully within 60 seconds.

#### Required MDX structure

```mdx
---
title: ButtonGroup
description: A container that groups related action buttons with consistent spacing and alignment.
status: reviewed | published
source: figma | url | prompt
createdBy: Henrik Vestgote
createdAt: 2024-01-13
---

import { ButtonGroup } from './ButtonGroup'
import { Canvas, Controls } from '@storybook/blocks'

# ButtonGroup

A container that groups related action buttons with consistent spacing,
alignment, and keyboard navigation. Use when presenting two or more
related actions that a user might take in the same context.

## When to use

- Confirm/cancel pairs in dialogs and forms
- Save/discard actions on editable content
- Primary action with secondary alternatives

## When not to use

- More than four buttons — use a menu or toolbar instead
- Unrelated actions that happen to appear near each other
- Navigation items — use a nav component instead

## Live example

<Canvas>
  <ButtonGroup>
    <Button variant="default">Save</Button>
    <Button variant="outline">Cancel</Button>
  </ButtonGroup>
</Canvas>

<Controls />

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Direction buttons are arranged |
| `spacing` | `'sm' \| 'md' \| 'lg'` | `'md'` | Gap between buttons |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment along the cross axis |
| `children` | `React.ReactNode` | — | Button elements to group |
| `className` | `string` | — | Additional CSS classes |

## Variants

### Horizontal (default)
Buttons arranged left to right. Use for most dialog and form contexts.

### Vertical
Buttons stacked top to bottom. Use in narrow containers or mobile-optimized layouts.

## Accessibility

- Arrow keys move focus between buttons when grouped
- `role="group"` applied to the container
- `aria-label` should be provided when buttons lack descriptive text
- First button receives focus on Tab; subsequent buttons via arrow keys

## Design tokens used

| Token | Value | Purpose |
|---|---|---|
| `--spacing-sm` | `4px` | Small gap variant |
| `--spacing-md` | `8px` | Default gap |
| `--spacing-lg` | `16px` | Large gap variant |
| `--radius` | `6px` | Inherited from Button |

## Examples

### Confirm dialog actions
\`\`\`tsx
<ButtonGroup>
  <Button variant="destructive">Delete</Button>
  <Button variant="outline">Cancel</Button>
</ButtonGroup>
\`\`\`

### Form submit row
\`\`\`tsx
<ButtonGroup align="end">
  <Button variant="ghost">Reset</Button>
  <Button variant="outline">Save draft</Button>
  <Button variant="default">Publish</Button>
</ButtonGroup>
\`\`\`

## Changelog

| Version | Change | Author |
|---|---|---|
| 1.0.0 | Initial generation | Agent (Design Studio) |
```

---

### Component Builder — agent prompt instructions

The following instructions are injected into every Component Builder invocation.
They are not editable by the user — they are platform-level constraints.

```
You are a senior React component engineer. You will generate a complete shadcn/ui
TypeScript component from the provided ComponentSpec.

STRICT OUTPUT REQUIREMENTS:

1. ComponentName.tsx
   - Use shadcn/ui primitives (Button, Card, Input etc.) as building blocks
   - TypeScript strict mode. No `any`. No type assertions unless unavoidable.
   - Props fully typed via ComponentName.types.ts — never inline prop types
   - Forward refs where appropriate (any component wrapping a DOM element)
   - Use `cn()` from @/lib/utils for conditional classNames
   - Support `className` prop on the root element always
   - Dark mode via Tailwind `dark:` variants
   - No hardcoded colors — use CSS variables and Tailwind semantic tokens only
   - Export as named export AND default export

2. ComponentName.types.ts
   - All interfaces and types for this component
   - Every prop documented with a JSDoc comment explaining its purpose
   - Export all types — consumers may need them
   - Use discriminated unions for variant props where applicable

   Example:
   \`\`\`ts
   export interface ButtonGroupProps {
     /** Direction buttons are arranged. Defaults to horizontal. */
     orientation?: 'horizontal' | 'vertical'
     /** Gap between buttons. Defaults to md. */
     spacing?: 'sm' | 'md' | 'lg'
     /** Alignment along the cross axis. Defaults to start. */
     align?: 'start' | 'center' | 'end'
     /** Button elements to render inside the group. */
     children: React.ReactNode
     /** Additional CSS classes applied to the root element. */
     className?: string
   }
   \`\`\`

3. ComponentName.stories.tsx
   - Storybook 8, CSF3 format
   - Default export with title, component, tags: ['autodocs']
   - One story per meaningful variant: Default, Vertical, WithDestructive etc.
   - Every story has a `name` and descriptive `args`
   - Include a story that demonstrates all props simultaneously (Kitchen Sink)
   - Include a story that demonstrates the accessibility pattern

4. ComponentName.docs.mdx
   - Follow the documentation standard exactly as specified in the platform docs
   - Written for a non-technical reader first, developer second
   - Every prop documented in the props table
   - At least two real-world usage examples with code
   - Accessibility section always included
   - Design tokens section always included
   - Do not omit any section — even if brief

QUALITY BAR:
A developer should be able to drop this component into a production codebase
with zero modifications. A designer should be able to read the docs and know
exactly when and how to use it. A non-technical stakeholder should understand
what the component does from the first paragraph alone.
```

---

### JSDoc standard for component files

Every exported function, interface, and type in the generated files must have
a JSDoc comment. Agents must follow this pattern:

```tsx
/**
 * ButtonGroup arranges related action buttons with consistent spacing and alignment.
 *
 * Use when presenting two or more related actions in the same context, such as
 * confirm/cancel pairs or save/discard actions.
 *
 * @example
 * <ButtonGroup>
 *   <Button variant="default">Save</Button>
 *   <Button variant="outline">Cancel</Button>
 * </ButtonGroup>
 */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = 'horizontal', spacing = 'md', align = 'start', children, className }, ref) => {
    // ...
  }
)

ButtonGroup.displayName = 'ButtonGroup'
```

Rules:
- First line: one sentence, plain English, what it is
- Second paragraph: when to use it
- `@example` with the most common usage
- `displayName` always set (required for Storybook and React DevTools)
- No `@param` tags on React components — props are documented in the types file
