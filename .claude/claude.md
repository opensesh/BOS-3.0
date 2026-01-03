# BOS 3.0 - Claude Development Guide

## Project Overview
Brand Operating System (BOS) 3.0 - AI-powered brand management platform built with Next.js 16+, React 19, TypeScript, and Tailwind CSS. Features multi-model AI chat (Claude, Perplexity), brand knowledge systems, and collaborative workspaces.

## Essential Commands
```bash
bun dev          # Start dev server (http://localhost:3000)
bun run build    # Production build
bun run lint     # ESLint
```

## Tech Stack
- **Framework**: Next.js 16+ App Router
- **UI**: React 19 + React Aria Components (accessibility)
- **Styling**: Tailwind CSS with UUI semantic tokens (CSS variables)
- **State**: Zustand
- **Database**: Supabase
- **AI**: Anthropic SDK (Claude), Perplexity API

## Key Directories
```
app/              # Next.js pages and API routes
components/ui/    # Design system primitives (buttons, inputs, etc.)
components/chat/  # Chat interface components
lib/ai/           # AI provider configs, auto-router, tools
lib/supabase/     # Database services
hooks/            # Custom React hooks
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Prefer `interface` for component props
- Use Zod for runtime validation where needed

### Components
- Use React Aria Components for accessible primitives
- Co-locate component-specific types in the same file
- Prefer composition over prop drilling

### Styling with CSS Variables
All colors use semantic CSS variables from `theme.css`:
```css
/* Backgrounds */
var(--bg-primary)      /* Main background */
var(--bg-secondary)    /* Elevated surfaces */
var(--bg-tertiary)     /* Hover states */

/* Foreground/Text */
var(--fg-primary)      /* Primary text */
var(--fg-secondary)    /* Secondary text */
var(--fg-tertiary)     /* Muted/disabled */

/* Brand */
var(--fg-brand-primary)   /* Brand text/icons */
var(--bg-brand-solid)     /* Brand buttons */

/* Borders */
var(--border-primary)     /* Default borders */
var(--border-secondary)   /* Subtle borders */
```

---

## Design System Guidelines

### Border Styling (IMPORTANT)
**Avoid harsh white or brand-colored outlines.** Borders should be subtle and supportive.

#### Border Hierarchy
```css
/* Default - Nearly invisible */
border border-[var(--border-primary)]/40

/* Hover - Slightly more visible */
hover:border-[var(--border-primary)]

/* Focus - Primary border, NOT brand color */
focus:border-[var(--border-primary)]
```

#### ❌ NEVER
```css
border-[var(--border-brand-solid)]
border-white
border-2
focus:ring-2 ring-[var(--bg-brand-solid)]
```

#### ✅ INSTEAD
```css
border border-[var(--border-primary)]/40
hover:border-[var(--border-primary)]
focus:border-[var(--border-primary)]
```

### Card Pattern
```css
bg-[var(--bg-secondary)]/30
border border-[var(--border-primary)]/40
hover:bg-[var(--bg-secondary)]/60
hover:border-[var(--border-primary)]
```

### Input Pattern
```css
bg-[var(--bg-secondary)]/30
border border-[var(--border-primary)]/40
focus:border-[var(--border-primary)]
focus:bg-[var(--bg-secondary)]/50
```

### Brand Color Usage
Use `--fg-brand-primary` and `--bg-brand-solid` sparingly:
- ✅ Primary action buttons (Submit, Send)
- ✅ Type badges/labels (small elements)
- ✅ Accent highlights
- ❌ NOT for borders or outlines

### Forbidden Icons
**Never use the `Sparkles` icon from Lucide.** It's generic AI aesthetic that doesn't match the brand vision. For empty states or prompts, use text-only or more purposeful iconography.

### Interactive States
```css
/* Hover-revealed actions */
opacity-0 group-hover:opacity-100 transition-opacity duration-150

/* Toggle buttons - use background, not borders */
/* Inactive */ text-[var(--fg-tertiary)] hover:bg-[var(--bg-secondary)]/50
/* Active */   bg-[var(--bg-tertiary)] text-[var(--fg-primary)]
```

---

## Icon Guidelines

### Banned Icons (NEVER USE)
- ❌ `Sparkles` - The 4-point star/galaxy icon looks like generic AI tooling. Use `Wand2`, `Target`, `Lightbulb`, or `Zap` instead.

### Preferred Alternatives
| Instead of | Use |
|------------|-----|
| Sparkles | Wand2, Target, Lightbulb, Zap |

### Modal Header Pattern
**Do NOT place icons in modal headers.** The header should contain only:
- Title (h2) - left-aligned
- Subtitle/description text (optional) - left-aligned  
- Close button (X) - right-aligned

❌ NEVER:
```tsx
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
    <SomeIcon className="w-5 h-5" />
  </div>
  <div>
    <h2>Modal Title</h2>
    <p>Subtitle</p>
  </div>
</div>
```

✅ INSTEAD:
```tsx
<div>
  <h2>Modal Title</h2>
  <p>Subtitle</p>
</div>
```

Icons belong in the modal body (e.g., selection cards), not duplicated in the header.

---

## Brand Colors Reference
| Token | Hex | Usage |
|-------|-----|-------|
| Charcoal | `#191919` | Dark backgrounds |
| Vanilla | `#FFFAEE` | Light/cream accents |
| Aperol | `#FE5102` | Primary brand color |
