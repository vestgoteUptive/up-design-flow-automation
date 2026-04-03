# Design Studio - Frontend

Next.js 14 app with TypeScript, Tailwind CSS, and App Router.

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (app)/             # Main app routes (requires auth)
│   ├── layout.tsx         # Root layout with fonts and theme
│   └── globals.css        # Design tokens and base styles
├── components/            # React components organized by feature
│   ├── app-shell/         # Shell: AppShell, Sidebar, Topbar
│   ├── auth/              # Auth forms
│   ├── projects/          # Project components
│   ├── studio/            # Studio components
│   ├── gallery/           # Gallery components
│   ├── settings/          # Settings components
│   └── ui/                # shadcn primitives
├── lib/                   # Utilities and helpers
│   ├── api.ts             # Typed API client
│   ├── auth.ts            # Auth helpers
│   ├── theme.tsx          # Theme provider and hook
│   ├── utils.ts           # Utility functions (cn, formatDate, etc.)
│   └── fonts.ts           # Font configuration
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── e2e/                   # Playwright E2E tests
```

## Tech Stack

- **Next.js 14** - App Router only
- **React 18** - UI library
- **TypeScript 5** - Strict mode enabled
- **Tailwind CSS 3** - Utility-first CSS with custom design tokens
- **SWR** - Data fetching and caching
- **Vitest** - Unit and integration tests
- **Playwright** - E2E tests

## Fonts

- **Fraunces** - Display headings, brand name, component names
- **Fragment Mono** - All labels, metadata, code, UI text

## Design System

All design tokens are defined in `app/globals.css` as CSS custom properties:

- Dark mode (default)
- Light mode
- Color tokens
- Spacing and radii
- Typography scales
- Shadows

Theme switching is handled by `ThemeProvider` with localStorage persistence.

## Getting Started

1. Copy `.env.example` to `.env.local` and configure:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests

## Development Notes

- No `any` types allowed - strict TypeScript
- All colors via CSS custom properties (no hardcoded values)
- Prefer shadcn primitives for UI components
- Co-locate tests in `__tests__` folders
- Use SWR for all API data fetching
- Inline errors only (no toast libraries)
