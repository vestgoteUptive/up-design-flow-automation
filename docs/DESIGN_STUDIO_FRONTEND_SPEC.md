# Design Studio — Frontend Implementation Specification

## For Claude Code

This document is the complete, authoritative specification for building the Design Studio
frontend. Read it fully before writing a single line of code. Every decision is made here.
Do not invent, assume, or default to conventions not stated in this document.

When something is not specified, ask before proceeding. Do not fill gaps with guesswork.

---

## 1. Tech Stack — Exact Versions

```
Next.js          14.x   App Router only. No Pages Router.
React            18.x
TypeScript       5.x    strict: true. No any. No type assertions without comment.
Tailwind CSS     3.x    CSS variables for theming. See token section.
shadcn/ui        latest Use as primitive building blocks only.
Fraunces         font   Display headings, brand name, component names, card titles.
Fragment Mono    font   All labels, metadata, code, UI text, navigation items.
Vitest           1.x    Unit and integration tests. Co-located in __tests__ folders.
Playwright       1.x    E2E tests in apps/web/e2e/
```

Add fonts via `next/font/google`. Never use system fonts, Inter, or Roboto.

---

## 2. Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx                  # Root layout: font injection, ThemeProvider, auth guard
│   ├── globals.css                 # CSS custom properties (tokens) for both themes
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (app)/                      # Authenticated shell — renders AppShell
│   │   ├── layout.tsx              # AppShell wrapper
│   │   ├── projects/
│   │   │   ├── page.tsx            # Discovery — all projects
│   │   │   └── new/
│   │   │       └── page.tsx        # Create project form
│   │   └── projects/[projectId]/
│   │       ├── layout.tsx          # Project context provider
│   │       ├── studio/
│   │       │   ├── page.tsx        # Studio — new session landing
│   │       │   └── [ideaId]/
│   │       │       └── page.tsx    # Studio — active session
│   │       ├── gallery/
│   │       │   ├── page.tsx        # Gallery grid
│   │       │   └── [ideaId]/
│   │       │       └── page.tsx    # Idea detail + build status
│   │       └── settings/
│   │           └── page.tsx        # Project settings (creator only)
├── components/
│   ├── app-shell/
│   │   ├── AppShell.tsx            # Root layout: sidebar + main area
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── UserRow.tsx
│   │   └── StatusStrip.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   └── CreateProjectForm.tsx
│   ├── studio/
│   │   ├── InputSelector.tsx       # Three-card input type picker
│   │   ├── FigmaPickerPanel.tsx    # Lazy-loaded component grid
│   │   ├── FigmaComponentCard.tsx
│   │   ├── UrlInputPanel.tsx
│   │   ├── PromptInputPanel.tsx
│   │   ├── EnrichmentPrompt.tsx    # Additional instructions field
│   │   ├── GenerateButton.tsx
│   │   ├── PreviewPane.tsx         # Sandboxed iframe + tab switcher
│   │   ├── CodeViewer.tsx          # Syntax highlighted tabs
│   │   ├── IterationThread.tsx
│   │   ├── IterationItem.tsx
│   │   └── SessionActions.tsx      # Bottom bar: back + mark reviewed
│   ├── gallery/
│   │   ├── GalleryGrid.tsx
│   │   ├── GalleryCard.tsx
│   │   ├── GalleryFilters.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── IdeaDetail.tsx
│   │   └── BuildProgress.tsx
│   ├── settings/
│   │   ├── SettingsCard.tsx        # Reusable card wrapper
│   │   ├── GitHubConnectionCard.tsx
│   │   ├── FigmaConnectionsCard.tsx
│   │   ├── FigmaConnectionItem.tsx
│   │   ├── AddFigmaForm.tsx
│   │   └── AgentInstructionsCard.tsx
│   └── ui/                         # shadcn primitives only — do not add custom logic here
├── lib/
│   ├── api.ts                      # Typed fetch wrapper for all API calls
│   ├── auth.ts                     # Session helpers, useAuth hook
│   ├── theme.ts                    # Theme context, useTheme hook
│   └── utils.ts                    # cn(), formatDate(), truncate()
├── hooks/
│   ├── useProject.ts
│   ├── useIdea.ts
│   ├── useIterations.ts
│   └── useFigmaComponents.ts
└── types/
    └── index.ts                    # Frontend-specific types (mirrors db types)
```

---

## 3. Design Tokens — CSS Custom Properties

Define in `app/globals.css`. All values hard-coded below. Do not deviate.

```css
/* ── DARK MODE (default) ─────────────────────────── */
[data-theme="dark"] {
  --bg-base:           #1C1917;
  --bg-sidebar:        #141210;
  --bg-surface:        #141210;
  --bg-elevated:       #1C1917;
  --bg-input:          #1C1917;
  --bg-hover:          #252220;

  --border-strong:     #3C3734;
  --border-subtle:     #292524;
  --border-faint:      #211F1D;

  --text-primary:      #E7E5E4;
  --text-secondary:    #A8A29E;
  --text-muted:        #78716C;
  --text-faint:        #57534E;
  --text-ghost:        #44403C;

  --accent:            #FB923C;
  --accent-subtle:     rgba(251, 146, 60, 0.10);
  --accent-border:     rgba(251, 146, 60, 0.25);
  --accent-glow:       rgba(251, 146, 60, 0.06);

  --green:             #4ADE80;
  --green-subtle:      rgba(74, 222, 128, 0.10);
  --green-border:      rgba(74, 222, 128, 0.25);

  --blue:              #60A5FA;
  --blue-subtle:       rgba(96, 165, 250, 0.10);

  --amber:             #FBBF24;
  --amber-subtle:      rgba(251, 191, 36, 0.10);

  --red:               #F87171;
  --red-subtle:        rgba(248, 113, 113, 0.10);

  --shadow-card:       0 1px 3px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.20);
  --shadow-elevated:   0 2px 8px rgba(0,0,0,0.50), 0 8px 32px rgba(0,0,0,0.30);
  --noise-opacity:     0.025;
  --radius:            10px;
  --radius-sm:         6px;
  --radius-lg:         14px;
}

/* ── DAY MODE ────────────────────────────────────── */
[data-theme="light"] {
  --bg-base:           #F5F2EE;
  --bg-sidebar:        #EDE9E4;
  --bg-surface:        #FFFFFF;
  --bg-elevated:       #F5F2EE;
  --bg-input:          #FFFFFF;
  --bg-hover:          #EDE9E4;

  --border-strong:     #C5BEB6;
  --border-subtle:     #DDD8D2;
  --border-faint:      #EDE9E4;

  --text-primary:      #1C1917;
  --text-secondary:    #57534E;
  --text-muted:        #78716C;
  --text-faint:        #A8A29E;
  --text-ghost:        #C5BEB6;

  --accent:            #EA6C1A;
  --accent-subtle:     rgba(234, 108, 26, 0.08);
  --accent-border:     rgba(234, 108, 26, 0.22);
  --accent-glow:       rgba(234, 108, 26, 0.04);

  --green:             #16A34A;
  --green-subtle:      rgba(22, 163, 74, 0.08);
  --green-border:      rgba(22, 163, 74, 0.20);

  --blue:              #2563EB;
  --blue-subtle:       rgba(37, 99, 235, 0.08);

  --amber:             #D97706;
  --amber-subtle:      rgba(217, 119, 6, 0.08);

  --red:               #DC2626;
  --red-subtle:        rgba(220, 38, 38, 0.08);

  --shadow-card:       0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  --shadow-elevated:   0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06);
  --noise-opacity:     0.012;
  --radius:            10px;
  --radius-sm:         6px;
  --radius-lg:         14px;
}

/* ── BASE STYLES ─────────────────────────────────── */
html { font-family: 'Fragment Mono', monospace; }
body { background: var(--bg-base); color: var(--text-primary); transition: background 0.25s ease, color 0.25s ease; }

/* Noise texture overlay on all surfaces */
.surface-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* fractalNoise SVG */
  opacity: var(--noise-opacity);
  pointer-events: none;
  border-radius: inherit;
}
```

### Tailwind config — map tokens

```ts
// tailwind.config.ts
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        base:      'var(--bg-base)',
        sidebar:   'var(--bg-sidebar)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        input:     'var(--bg-input)',
        hover:     'var(--bg-hover)',
        border: {
          strong:  'var(--border-strong)',
          subtle:  'var(--border-subtle)',
          faint:   'var(--border-faint)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          faint:     'var(--text-faint)',
          ghost:     'var(--text-ghost)',
        },
        accent:    'var(--accent)',
        green:     'var(--green)',
        blue:      'var(--blue)',
        amber:     'var(--amber)',
        red:       'var(--red)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        mono:    ['Fragment Mono', 'monospace'],
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg:  'var(--radius-lg)',
      },
      boxShadow: {
        card:     'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
}
```

---

## 4. Theme System

### ThemeProvider

```tsx
// lib/theme.ts
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // 1. Check localStorage
    const stored = localStorage.getItem('ds-theme') as Theme | null
    // 2. Fall back to system preference
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    const resolved = stored ?? system
    setTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('ds-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

### Inline script in `<head>` — prevents flash of wrong theme

```tsx
// app/layout.tsx — inside <head>
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        var stored = localStorage.getItem('ds-theme');
        var system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', stored || system);
      })();
    `,
  }}
/>
```

### ThemeToggle component

```tsx
// components/app-shell/ThemeToggle.tsx
'use client'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 cursor-pointer group"
      aria-label={`Switch to ${isDark ? 'day' : 'dark'} mode`}
    >
      <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">☀️</span>

      <div className="relative w-9 h-5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-hover)] transition-colors duration-300">
        <div
          className={cn(
            'absolute top-[3px] left-[3px] w-[14px] h-[14px] rounded-full bg-[var(--accent)]',
            'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            !isDark && 'translate-x-4'
          )}
        />
      </div>

      <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">🌙</span>

      <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--accent)] w-7">
        {isDark ? 'Dark' : 'Day'}
      </span>
    </button>
  )
}
```

---

## 5. Typography Rules

```
Fraunces (font-display):
  — Brand name: 17px, weight 300, italic
  — "Studio" in brand: weight 700, not italic
  — Page titles: 22–28px, weight 700, tracking -0.02em
  — Card titles: 13–14px, weight 700, tracking -0.01em
  — Component names in gallery: 14px, weight 400
  — Project names in sidebar: 12px, weight 300

Fragment Mono (font-mono):
  — All navigation items
  — All labels (section headers, field labels)
  — All metadata (dates, counts, usernames)
  — All badges and status indicators
  — Code blocks
  — URL bar
  — Button text
  — Input placeholder text

Label style (all-caps Fragment Mono):
  font-size: 8–9px
  text-transform: uppercase
  letter-spacing: 0.12–0.18em
  color: var(--text-ghost) or var(--text-faint)
```

---

## 6. Component Specifications

### 6.1 AppShell

```
Layout: flex-row, full viewport height, no overflow on shell itself.

Sidebar: 232px fixed width, flex-col, bg-sidebar, border-r border-[--border-subtle]
  — Never collapses or hides (desktop-only tool, min-width 1280px enforced)
  — Sections: Brand → Projects list → (spacer) → Nav items → User row

Main area: flex-1, flex-col, overflow hidden
  — Topbar: 50px fixed height, border-b
  — Content: flex-1, overflow-y-auto
  — Status strip: 30px fixed height, border-t, bg-sidebar
```

### 6.2 Sidebar

**Brand block** (padding 20px 18px 16px, border-b border-faint):
```
"Design" in text-secondary, weight 300, italic
"Studio" in --accent, weight 700, not italic
Sub-label: "Component Platform" — 8px, ghost, uppercase, tracking-wide
```

**Project list** (padding 14px 10px 8px):
```
Section label: "PROJECTS" — 8px, ghost, uppercase, tracking-[0.18em], padding 0 8px
Project item: flex-row, gap-9px, padding 7px 8px, rounded-[7px]
  — Project dot: 8×8px, rounded-[2px], colored per project
  — Project name: Fraunces 12px weight-300, text-muted
  — Active state: bg-[--accent-subtle], name becomes text-primary
  — Hover: bg-[--bg-hover]
Add project: "+ New project" — mono 10px, ghost, cursor-pointer
```

**Nav section** (margin-top auto, padding 10px, border-t border-faint):
```
Items: flex-row, gap-9px, padding 7px 8px, rounded-[6px]
  — Icon: 12px, w-14px text-center (use Unicode symbols: ✦ ⊡ ⚙)
  — Label: mono 10px, text-faint
  — Active: bg-[--accent-subtle], text-[--accent]
  — Hover: bg-[--bg-hover], text-secondary
Items in order: Studio (✦), Gallery (⊡), Settings (⚙)
```

**User row** (padding 14px 10px, border-t border-faint):
```
Avatar: 28×28px circle, gradient from --accent to #C2410C, Fraunces 11px bold white initials
Name: Fraunces 11px weight-400, text-secondary, truncate
Role: mono 8px, ghost, uppercase
Sign out: mono 9px ghost, "↪" symbol, hover → text-faint
```

### 6.3 Topbar

```
Height: 50px
Border: 1px bottom, --border-subtle
Padding: 0 28px
Content: breadcrumb (left) + actions (right, gap-10px)

Breadcrumb:
  "ProjectName / PageName"
  — "ProjectName": mono 10px, text-faint
  — " / ": text-ghost
  — "PageName": --accent, not italic

Actions always include:
  — ThemeToggle (see 4 above)
```

### 6.4 StatusStrip

```
Height: 30px
Background: --bg-sidebar
Border: 1px top, --border-faint
Padding: 0 28px
Layout: flex-row, gap-20px, items-center

Status item: flex-row, gap-5px
  — Dot: 5×5px circle
    ok   → --green, box-shadow: 0 0 4px --green
    warn → --amber
    err  → --red
  — Label: mono 9px, uppercase, tracking-[0.1em], text-ghost

Right side (margin-left auto): "Last saved X min ago" — mono 9px, text-ghost
```

### 6.5 SettingsCard

```
Background: --bg-surface
Border: 1px, --border-subtle
Border-radius: --radius (10px)
Box-shadow: --shadow-card

Card head: padding 13px 16px, border-b border-faint
  — Title: Fraunces 13px bold, text-primary, tracking-[-0.01em]
  — Badge: right-aligned (see badge variants below)

Card body: padding 14px 16px, flex-col, gap-11px

Badge variants:
  connected: bg-[--green-subtle], color --green, border 1px --green-border
  count:     bg-[--bg-elevated], color text-muted, border 1px --border-subtle
  custom:    bg-[--accent-subtle], color --accent, border 1px --accent-border
  All badges: mono 8px, uppercase, tracking-[0.1em], padding 2px 7px, rounded-[4px]
```

### 6.6 Field (within settings cards)

```
flex-col, gap-4px

Label: mono 8px, uppercase, tracking-[0.14em], text-ghost

Value input / display:
  background: --bg-input
  border: 1px --border-subtle
  border-radius: --radius-sm (6px)
  padding: 6px 10px
  font: mono 10px, text-secondary

  Accent variant (connected/active values):
    border-color: --accent-border
    color: --accent
    background: --accent-glow
```

### 6.7 FigmaConnectionItem

```
Background: --bg-elevated
Border: 1px --border-faint
Border-radius: 7px
Padding: 9px 11px
Layout: flex-row, gap-9px, items-center

Figma icon: 26×26px, --bg-surface, border 1px --border-subtle, rounded-[6px]
  — "F" in Fraunces 11px italic, --accent

Name: mono 10px, text-primary
Key: mono 8px, text-ghost, margin-top 2px

Status dot: 6×6px, --green, box-shadow: 0 0 6px --green
```

**Add Figma button:**
```
Border: 1px dashed --border-subtle
Border-radius: 7px
Padding: 9px
Text: mono 10px, text-ghost, centered, "+ Add Figma file"
Hover: border-color --accent-border, color --accent, background --accent-glow
Transition: all 0.2s
```

### 6.8 AgentInstructionsCard

```
Textarea area:
  background: --bg-elevated
  border: 1px --border-faint
  border-radius: 7px
  padding: 11px 13px
  font: mono 10px, text-muted, line-height 1.7
  min-height: 80px

Blinking cursor: 1px × 11px, --accent, animation: blink 1.1s step-end infinite

Save button:
  background: --accent-subtle
  border: 1px --accent-border
  color: --accent
  font: mono 9px, uppercase, tracking-[0.08em]
  padding: 5px 12px
  rounded: --radius-sm
  Hover: background --accent, color #fff, border --accent
  Transition: all 0.2s
```

### 6.9 GalleryCard

```
Background: --bg-surface
Border: 1px --border-subtle
Border-radius: --radius
Border-left: 3px solid (varies by status — see below)
Box-shadow: --shadow-card
Cursor: pointer
Hover: box-shadow --shadow-elevated, transition 0.2s

Status border-left colors:
  REVIEWED  → --border-strong (neutral)
  BUILDING  → --amber
  PR_OPEN   → --blue
  VERIFIED  → --green
  PUBLISHED → --green
  FAILED    → --red

Thumbnail area:
  height: 140px
  background: --bg-elevated
  border-bottom: 1px --border-faint
  display: flex, items-center, justify-center
  overflow: hidden

Card body: padding 12px 14px

Component name: Fraunces 14px weight-400, text-primary
Meta row: mono 10px, text-ghost, gap-6px
  Format: "by [Name] · [source] · [relative date]"
  Separator dots: 2×2px, --border-strong

Footer: flex-row, justify-between, items-center, margin-top 8px
  — StatusBadge (left)
  — "Send to Build" button (right, only when status REVIEWED)
```

### 6.10 StatusBadge

```
Font: mono 8px, uppercase, tracking-[0.1em]
Padding: 2px 8px
Border-radius: 4px

Variants:
  REVIEWED:  bg --bg-elevated,     color text-muted,     border 1px --border-subtle
  BUILDING:  bg --amber-subtle,    color --amber,         border 1px rgba(amber, 0.3)
             animate: pulse 2s ease-in-out infinite (opacity 0.7 → 1)
  PR_OPEN:   bg --blue-subtle,     color --blue,          border 1px rgba(blue, 0.3)
  VERIFIED:  bg --green-subtle,    color --green,         border 1px --green-border
  PUBLISHED: bg --green,           color #fff,            border none
  FAILED:    bg --red-subtle,      color --red,           border 1px rgba(red, 0.3)
```

### 6.11 InputSelector (Studio entry)

```
Layout: Three cards side by side, equal width, gap-12px
Container: flex-row, padding 40px 32px

Each card:
  background: --bg-surface
  border: 1px --border-subtle
  border-radius: --radius-lg (14px)
  padding: 28px 24px
  cursor: pointer
  flex: 1
  transition: border-color 0.2s, box-shadow 0.2s

  Hover:
    border-color: --accent-border
    box-shadow: 0 0 0 1px --accent-border

  Selected:
    border-color: --accent
    box-shadow: 0 0 0 1px --accent, --shadow-elevated

  Icon: 24px Unicode symbol, --accent, margin-bottom 16px
    Figma  → ⬡
    URL    → ⊕
    Prompt → ✎

  Title: Fraunces 15px bold, text-primary, margin-bottom 6px
  Description: mono 10px, text-muted, line-height 1.6

When one card is selected:
  — Selected card stays full size
  — Other two: opacity 0.4, pointer-events none
  — Below selected card: input form slides down (height animation, 0 → auto, 300ms ease-out)
```

### 6.12 FigmaPickerPanel

```
Structure:
  Connection selector dropdown (if multiple Figma connections)
  Toggle bar: "Groups" / "Components" — pill toggle, --accent active
  Search input: mono 10px, placeholder "Search components..."
  Lazy-loaded grid: grid-cols-2 for groups, grid-cols-3 for components, gap-8px
  Selected chips below grid
  "Next →" button (disabled until selection made)

FigmaComponentCard:
  background: --bg-elevated
  border: 1px --border-faint
  border-radius: 8px
  overflow: hidden
  cursor: pointer

  Thumbnail: height 72px, bg --bg-base, flex center
    Loading state: animated shimmer (bg gradient left-to-right, 1.5s infinite)
    Loaded: img element, object-fit contain, padding 8px

  Label: padding 6px 8px
    Name: mono 9px, text-secondary, truncate
    Count (groups only): mono 8px, text-ghost, "8 variants"

  Selected state:
    border-color: --accent
    box-shadow: 0 0 0 1px rgba(--accent, 0.4)
    Checkmark overlay: top-right, 16×16px circle, --accent, white ✓, 8px

Lazy loading implementation:
  Use IntersectionObserver on each card
  src starts as undefined
  When card enters viewport → fetch image → set src
  Images cached via SWR with key "figma-image-[nodeId]"
```

### 6.13 PreviewPane

```
Layout: flex-1, flex-col, padding 24px, gap-16px

Header: flex-row, justify-between, items-center
  Left: Fraunces 15px text-primary — component name
  Right: Tab row — "Preview" | "Component" | "Story" | "Docs"
    Tab: mono 9px, padding 4px 10px, rounded-[4px]
    Active: bg --bg-elevated, text-primary
    Inactive: text-faint

Preview frame:
  flex-1, bg --bg-elevated, border 1px --border-subtle, rounded --radius
  Accent glow on border when actively generating:
    border-image: linear-gradient(135deg, --accent-border, transparent 60%)
  Contains: <iframe sandbox="allow-scripts allow-same-origin" />
  Sandpack or equivalent for live rendering

Code tabs (when code tab active):
  Sub-tabs: "Component" | "Story" | "Types" | "Docs"
  Syntax highlighted (Shiki or Prism)
  Background: --bg-base, mono 10px, line-height 1.6
  Line numbers: text-ghost

Generation loading state (replaces iframe):
  Pulsing outline animation:
    Rounded rect, border 1px dashed --accent-border
    opacity: 0.3 → 0.7, 1.4s ease-in-out infinite
  Status text below, mono 10px, text-muted, cycles every 2s:
    "Reading your input..."
    "Designing component..."
    "Writing TypeScript..."
    "Rendering preview..."
```

### 6.14 IterationThread

```
Width: 200px fixed
Border-left: 1px --border-subtle
Padding: 16px
Layout: flex-col, gap-12px
Overflow-y: auto

Section label: mono 8px, ghost, uppercase, tracking-[0.12em] — "ITERATIONS"

Iteration item: flex-row, gap-8px
  Left column: flex-col, items-center
    Dot: 6×6px circle
      Most recent: --accent
      Others: --border-strong
    Connector line: 1px width, flex-1 height
      Most recent connector: linear-gradient(--accent-border, --border-faint)
      Others: --border-faint

  Right column:
    Prompt text: mono 9px, text-faint (inactive) or text-secondary (most recent)
    Timestamp: mono 8px, text-ghost, margin-top 2px

Refine input (pinned to bottom):
  background: --bg-elevated
  border: 1px --border-subtle
  border-radius: 6px
  padding: 7px 9px
  mono 9px, text-ghost placeholder
  On focus: border-color --accent-border
```

### 6.15 SessionActions bar

```
Height: 44px
Background: --bg-sidebar
Border-top: 1px --border-faint
Padding: 0 24px
Layout: flex-row, justify-between, items-center

Left: "← Back to input" — mono 10px, text-faint, cursor-pointer
  Hover: text-secondary
  Click: confirms if iterations exist ("Start over? Your iterations will be lost.")

Right: "Mark as Reviewed →" — mono 10px, --accent, border 1px --accent-border
  padding: 5px 14px, rounded --radius-sm
  Hover: bg --accent-subtle
  Click: confirmation sheet then status update + redirect to gallery
```

### 6.16 BuildProgress

```
Full-width panel shown after "Send to Build" is confirmed.
Background: --bg-surface, border 1px --border-subtle, rounded --radius, padding 24px

Header: flex-row, gap-12px
  Component preview icon: 44×44px, --accent-subtle, border 1px --accent-border, rounded-[10px]
  Name: Fraunces 16px bold, text-primary
  Meta: mono 10px, text-ghost — "Promoted by [name] · [project] · from [source]"

Pipeline steps row: flex-row, items-center (6 steps)

Step:
  flex-col, items-center, gap-10px, flex-1, position relative

  Connector line (::before, between steps):
    position absolute, top 20px, left 50%, right -50%
    height 1px
    Done: --green, opacity 0.4
    Active: linear-gradient(--accent-border, --border-faint)
    Pending: --border-faint

  Icon circle: 40×40px, rounded-full
    Done:    bg --green-subtle, border 1px --green-border, content "✓", color --green
    Active:  bg --accent-subtle, border 1px --accent-border, content "⟳" (spinning), --accent
             box-shadow: 0 0 16px --accent-glow
    Pending: bg transparent, border 1px --border-faint, content "○", text-ghost

  Label: mono 10px, uppercase, tracking-[0.06em]
    Done:    --green
    Active:  text-primary
    Pending: text-ghost

  Sub: mono 9px
    Done:    green, opacity 0.6
    Active:  text-faint
    Pending: text-ghost

Step labels in order:
  "Prepare" → "Generate" → "Stories" → "Verify" → "PR Open" → "Publish"

PR link (shown when PR_OPEN):
  flex-row, gap-8px, items-center
  bg --accent-subtle, border 1px --accent-border, rounded-[8px], padding 10px 14px
  Dot: 8×8px, --accent, box-shadow 0 0 8px --accent
  Text: mono 11px, --accent — full PR URL

Verification results (shown when VERIFIED or later):
  3-col grid, gap-12px
  Each cell: bg --bg-elevated, border 1px --border-faint, rounded --radius, padding 14px
    Label: mono 10px, uppercase, text-ghost
    Value: Fraunces 18px bold
      Pass: --green
      Score: --accent
      Fail: --red
    Sub: mono 9px, text-ghost
```

---

## 7. Auth Screens

```
Layout: full viewport, flex center, bg --bg-base
  Optional: subtle radial gradient, --accent-glow at 20% opacity, centered

Card:
  width: 380px
  bg --bg-surface
  border: 1px --border-subtle
  rounded --radius-lg
  box-shadow: --shadow-elevated
  padding: 32px

Header:
  Brand name (Fraunces 18px, same as sidebar)
  Page title (Fraunces 22px bold, text-primary, margin-top 24px)
  Subtitle (mono 10px, text-muted)

Form:
  flex-col, gap-14px, margin-top 24px

Field label: mono 8px, uppercase, tracking-wide, text-ghost, margin-bottom 4px
Input:
  width: 100%
  bg --bg-input
  border: 1px --border-subtle
  rounded --radius-sm
  padding: 8px 12px
  mono 11px, text-primary
  placeholder: text-ghost
  Focus: border --accent-border, outline none, box-shadow 0 0 0 2px --accent-glow
  Error state: border --red, box-shadow 0 0 0 2px rgba(red, 0.1)

Error message: mono 9px, --red, margin-top 3px

Submit button:
  width: 100%
  bg --accent
  color: #fff (dark mode) or #fff (light mode — contrast sufficient)
  padding: 10px
  rounded --radius-sm
  font: mono 11px, uppercase, tracking-[0.06em]
  Hover: opacity 0.9
  Loading: disabled, spinner replaces text, opacity 0.7
  Transition: all 0.2s

Link to other auth screen:
  mono 9px, text-faint, margin-top 16px, text-center
  Link text: --accent, hover underline

Password strength indicator (register only):
  4-segment bar below password field
  Segments: bg --border-subtle (inactive), colored (active)
  Weak: 1 segment, --red
  Fair: 2 segments, --amber
  Good: 3 segments, --blue
  Strong: 4 segments, --green
```

---

## 8. Gallery Filters Bar

```
Layout: flex-row, gap-8px, margin-bottom 24px
Wrap: wrap

Filter pill:
  font: mono 10px, uppercase, tracking-[0.06em]
  padding: 4px 12px
  border: 1px --border-subtle
  rounded-full
  color: text-faint
  cursor: pointer
  Hover: border --accent-border, color text-secondary
  Active: bg --accent-subtle, border --accent-border, color --accent
  Transition: all 0.15s

Groups:
  Status: All · Reviewed · Building · PR Open · Published · Failed
  Source: Figma · URL · Prompt
  Separator: 1px vertical line, --border-faint, height 16px, mx-4px
```

---

## 9. Project Discovery Page

```
Page layout: padding 32px, flex-col, gap-40px

Section 1 — "Your Projects" (horizontal scroll):
  Section label: mono 9px, uppercase, tracking-wide, text-ghost, margin-bottom 12px
  Scroll container: flex-row, gap-12px, overflow-x auto, pb-4px
  Card width: 260px, flex-shrink 0

Section 2 — "All Projects":
  Section label + count
  Grid: grid-cols-3, gap-16px, auto-rows

ProjectCard:
  bg --bg-surface, border 1px --border-subtle, rounded --radius, shadow-card
  padding: 18px
  cursor: pointer
  Hover: shadow-elevated, border --border-strong

  Header: flex-row, items-start, justify-between
    Project color dot: 10×10px, rounded-[3px]
    Join button (if not joined):
      mono 9px, --accent, border 1px --accent-border, padding 3px 9px, rounded-[4px]
      Hover: bg --accent-subtle
    Joined badge (if joined):
      mono 8px, text-ghost, "✓ Joined"

  Name: Fraunces 15px bold, text-primary, margin-top 10px
  Description: mono 10px, text-muted, line-height 1.6, max 2 lines, clamp
  Footer: flex-row, gap-12px, margin-top 14px
    "N members" — mono 9px, text-ghost
    "by [name]" — mono 9px, text-ghost
```

---

## 10. Interaction & Animation Rules

```
ALL transitions: 0.2s ease or 0.25s ease unless specified otherwise
NO bounce animations except: ThemeToggle knob (cubic-bezier(0.34,1.56,0.64,1))
NO dramatic entrance animations — content appears, not performs

Permitted animations:
  — Fade in: opacity 0→1, 150ms ease
  — Slide in panel: translateX(-8px)→0, opacity 0→1, 200ms ease-out
  — Height expand (input forms): max-height 0→value, 300ms ease-out
  — Shimmer (loading): background-position animation, 1.5s infinite
  — Pulse (BUILDING badge): opacity 0.7→1, 2s ease-in-out infinite
  — Cursor blink: opacity 1→0, 1.1s step-end infinite
  — Spinner (active build step): rotate 360deg, 0.8s linear infinite

Hover states must be instant (0ms delay) — no hover animation delay
Focus rings: box-shadow 0 0 0 2px --accent-glow, never outline:none without replacement
```

---

## 11. Empty States

Every empty state: illustration area (48×48px icon, text-ghost) + message + CTA.

```
Component       | Icon | Message                                      | CTA
─────────────────────────────────────────────────────────────────────────────────
Projects empty  |  ⊕   | "No projects yet."                           | "Create project"
Not joined any  |  ⊡   | "You haven't joined a project yet."          | scroll to All
Studio no sess. |  ✦   | "Start your first idea"                      | InputSelector
Gallery empty   |  ⊡   | "No reviewed ideas yet."                     | "Open Studio"
Figma no conn.  |  F   | "No Figma files connected."                  | "Go to Settings"
Figma no comps  |  ⬡   | "No components found in this file."         | link to Figma
```

Icon style: 48×48px, --bg-elevated, rounded --radius, border 1px --border-faint, text-ghost centered.
Message: Fraunces 14px, text-muted, margin-top 12px.
CTA: same as save-btn style.

---

## 12. Error States

Inline errors only. No toast libraries. No modal errors.

```
Field error: mono 9px, --red, appears below field, fade-in 150ms
Form error (server): mono 10px, --red, bg --red-subtle, border 1px rgba(--red,0.2),
  rounded --radius-sm, padding 8px 12px, margin-bottom 16px

Connection errors (Figma, GitHub): appear inside the settings card body
  Same style as form error, with a "Retry" link in --accent

Generation error: replaces preview frame
  Icon: ⚠ in --red, 24px
  Message: Fraunces 14px, text-muted
  Sub: mono 10px, text-ghost — specific error reason
  Button: "Try again" — same as save-btn
```

---

## 13. API Client

```ts
// lib/api.ts

const BASE = process.env.NEXT_PUBLIC_API_URL!

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // JWT in httpOnly cookie
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  auth: {
    register:   (body: RegisterBody)  => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login:      (body: LoginBody)     => request<AuthResponse>('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    me:         ()                    => request<User>('/auth/me'),
    logout:     ()                    => request<void>('/auth/logout',           { method: 'POST' }),
  },
  projects: {
    list:       ()                    => request<Project[]>('/projects'),
    get:        (id: string)          => request<Project>(`/projects/${id}`),
    create:     (body: CreateProject) => request<Project>('/projects',           { method: 'POST', body: JSON.stringify(body) }),
    update:     (id: string, body: UpdateProject) => request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    join:       (id: string)          => request<void>(`/projects/${id}/join`,   { method: 'POST' }),
  },
  figma: {
    list:       (projectId: string)   => request<FigmaConnection[]>(`/projects/${projectId}/figma`),
    add:        (projectId: string, body: AddFigmaConnection) => request<FigmaConnection>(`/projects/${projectId}/figma`, { method: 'POST', body: JSON.stringify(body) }),
    remove:     (projectId: string, id: string) => request<void>(`/projects/${projectId}/figma/${id}`, { method: 'DELETE' }),
    components: (projectId: string, connectionId: string) => request<FigmaComponentGroup[]>(`/projects/${projectId}/figma/${connectionId}/components`),
    image:      (projectId: string, connectionId: string, nodeId: string) => request<{ url: string }>(`/projects/${projectId}/figma/${connectionId}/image/${nodeId}`),
  },
  ideas: {
    list:       (projectId: string)   => request<Idea[]>(`/projects/${projectId}/ideas`),
    get:        (projectId: string, id: string) => request<Idea>(`/projects/${projectId}/ideas/${id}`),
    create:     (projectId: string, body: CreateIdea) => request<Idea>(`/projects/${projectId}/ideas`, { method: 'POST', body: JSON.stringify(body) }),
    update:     (projectId: string, id: string, body: Partial<Idea>) => request<Idea>(`/projects/${projectId}/ideas/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    markReviewed: (projectId: string, id: string) => request<Idea>(`/projects/${projectId}/ideas/${id}/review`, { method: 'POST' }),
  },
  iterations: {
    list:       (ideaId: string)      => request<Iteration[]>(`/ideas/${ideaId}/iterations`),
    create:     (ideaId: string, body: CreateIteration) => request<Iteration>(`/ideas/${ideaId}/iterations`, { method: 'POST', body: JSON.stringify(body) }),
  },
  gallery: {
    list:       (projectId: string, filters?: GalleryFilters) => request<Idea[]>(`/projects/${projectId}/gallery?${new URLSearchParams(filters as any)}`),
    promote:    (projectId: string, ideaId: string) => request<Promotion>(`/projects/${projectId}/gallery/${ideaId}/promote`, { method: 'POST' }),
  },
  promotions: {
    get:        (ideaId: string)      => request<Promotion>(`/promotions/${ideaId}`),
  },
}
```

---

## 14. State Management

No Redux. No Zustand. Use:
- React Context for: auth state, theme, current project
- SWR for: all server data fetching (auto-revalidation, caching)
- `useState` / `useReducer` for: local UI state only

```ts
// hooks/useProject.ts
import useSWR from 'swr'
import { api } from '@/lib/api'

export function useProject(projectId: string) {
  return useSWR(`/projects/${projectId}`, () => api.projects.get(projectId))
}

// hooks/useFigmaComponents.ts — with lazy image loading
export function useFigmaComponents(projectId: string, connectionId: string) {
  return useSWR(
    connectionId ? `/figma/${connectionId}/components` : null,
    () => api.figma.components(projectId, connectionId),
    { revalidateOnFocus: false } // Figma data doesn't change often
  )
}
```

---

## 15. Route Protection

```tsx
// app/(app)/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <AppShell>{children}</AppShell>
}
```

Settings page — creator-only guard:

```tsx
// app/(app)/projects/[projectId]/settings/page.tsx
const project = await api.projects.get(projectId)
const session = await getServerSession()
if (project.creatorId !== session.userId) {
  return <AccessDenied message="Only the project creator can edit settings." />
}
```

---

## 16. Testing Requirements

Every component must have tests. No exceptions.

```
Unit tests (Vitest + React Testing Library):
  — Every component renders without crashing
  — Interactive elements (buttons, toggles, forms) fire correct handlers
  — Empty states render when data is empty array
  — Error states render when API returns error
  — ThemeToggle: clicking toggles data-theme on documentElement
  — All form validations

Integration tests (Vitest):
  — api.ts functions call correct endpoints with correct payloads
  — Auth redirect happens when session missing
  — SWR hooks fetch and return correct data shape

E2E tests (Playwright):
  — Full auth flow: register → login → redirect to /projects
  — Join project → navigate to studio → create idea (prompt input) → mark reviewed
  — Gallery: see reviewed idea → send to build → see building status
  — Theme toggle: persists across page refresh
  — Settings: add Figma connection → appears in list

File co-location:
  components/settings/SettingsCard.tsx
  components/settings/__tests__/SettingsCard.test.tsx
  app/(app)/projects/[projectId]/settings/__tests__/page.test.tsx
```

---

## 17. Accessibility Checklist

Every PR must pass:
- [ ] All interactive elements reachable by Tab in logical order
- [ ] Focus rings visible (never removed without custom replacement)
- [ ] Color never the only state indicator (always + text or icon)
- [ ] All images have `alt` text
- [ ] Icon-only buttons have `aria-label`
- [ ] iframes have `title` attribute
- [ ] Loading states use `aria-live="polite"`
- [ ] Modals trap focus and close on Escape
- [ ] Minimum contrast: 4.5:1 body text, 3:1 large text
- [ ] axe-core in Playwright E2E — zero violations

---

## 18. What NOT to Do

- Do not use `any` type anywhere
- Do not use inline styles (use Tailwind or CSS variables)
- Do not hardcode colors — all colors via CSS custom properties
- Do not use React Router — Next.js App Router only
- Do not use class components
- Do not install animation libraries (Framer Motion, GSAP) — CSS animations only
- Do not use toast notification libraries — inline errors only
- Do not add console.log statements to committed code
- Do not use `localStorage` directly — always through `lib/theme.ts` or `lib/auth.ts`
- Do not create components larger than 200 lines — split into sub-components
- Do not skip writing tests to "do it later"
- Do not use `px` for font sizes in Tailwind config — use the rem scale
- Do not override shadcn component internals — compose, don't hack
