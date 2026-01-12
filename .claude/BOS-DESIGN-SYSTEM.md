# BOS Design System Reference

> This reference provides design system context for all Claude Code plugins in your workspace.
> Import this context when building or reviewing UI components.

---

## Brand Philosophy

**"Steward, not advisor"** — Act as a team member who speaks FROM within the brand, not an external consultant.

- Use "we" and "our" when discussing brand decisions
- Don't preface responses with "according to guidelines"
- Make brand-aligned choices feel natural, not prescriptive

---

## Core Colors (BRAND-OS)

The system uses **warm neutrals** instead of harsh black/white for an inviting, approachable feel.

| Token | Hex | Role |
|-------|-----|------|
| **Aperol** | `#FE5102` | Primary accent — CTAs, links, badges, alerts |
| **Charcoal** | `#191919` | Warm dark — Dark mode backgrounds, primary text |
| **Vanilla** | `#FFFAEE` | Warm light — Light mode backgrounds, light text |

### Color Usage Rules
- **Brand colors (Aperol)**: Use sparingly for primary CTAs, active states, badges
- **NEVER** use brand colors for borders or harsh outlines
- **Semantic colors**: Success (emerald-500), Warning (amber-500), Error (red-500)

### Contrast Ratios
- Vanilla on Charcoal: **18.5:1** (AAA compliant)
- Charcoal on Vanilla: **18.5:1** (AAA compliant)

---

## Typography

| Category | Font | Usage |
|----------|------|-------|
| **Headings** | Neue Haas Grotesk Display Pro | Headlines, titles, emphasis |
| **Body** | Neue Haas Grotesk Display Pro | Body text, paragraphs |
| **Accent/Display** | Offbit | Digital/tech feel, monospace-style accent |
| **Code** | SF Mono, Consolas, Monaco | Code blocks, technical content |

---

## Border & Interaction Philosophy

Borders should **support, not dominate** the visual hierarchy.

### Border States
```css
/* Default: Nearly invisible */
border-[var(--border-primary)]/40

/* Hover: Slightly more visible */
hover:border-[var(--border-primary)]

/* Focus: Full visibility, but NOT brand color */
focus:border-[var(--border-primary)]
```

### Card Pattern
```jsx
className="bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40 hover:bg-[var(--bg-secondary)]/60"
```

---

## Component Patterns

### Buttons
- Built on React Aria for full WCAG compliance
- Primary: Aperol background, warm hover state
- Secondary: Transparent with subtle border
- Tertiary: Text-only with hover underline

### Form Inputs
- Subtle border at rest
- Brand accent on focus (but not harsh)
- Clear label hierarchy
- Helpful hint text below

### Cards & Containers
- Use `bg-secondary/30` for subtle layering
- Rounded corners: `rounded-lg` (8px) or `rounded-xl` (12px for brand)
- Shadows use Charcoal (25,25,25) not pure black

---

## Animation & Motion

| Library | Usage |
|---------|-------|
| **Framer Motion** | Complex choreographed animations |
| **GSAP** | High-performance scroll, timeline animations |
| **Tailwind Animate** | Simple utility-based transitions |

### Keyframes Available
- `fadeIn`, `slideInRight`, `slideOutRight`
- `sidebarExpand`, `labelReveal`
- `blob`, `cursor`, `dot-pulse`, `dot-wave`

---

## Accessibility (A11y) First

- All components use **React Aria Components**
- Focus states are always visible
- Color contrast meets AAA standards
- Screen reader support built-in

---

## Voice & Tone

| Quality | Description |
|---------|-------------|
| **Smart but not smug** | Expert knowledge without condescension |
| **Technical but accessible** | Explain concepts clearly |
| **Confident but humble** | State opinions, remain open |
| **Warm but professional** | Friendly without being casual |

**Formula**: Expert + Humble + Accessible + Community-focused = **Open Session**

---

## Quick Reference: Semantic Tokens

### Backgrounds
- `--bg-primary` — Main background
- `--bg-secondary` — Elevated surfaces
- `--bg-tertiary` — Cards, inputs
- `--bg-overlay` — Modal overlays

### Foregrounds (Text)
- `--fg-primary` — Main text
- `--fg-secondary` — Secondary text
- `--fg-tertiary` — Placeholder, muted

### Borders
- `--border-primary` — Default borders
- `--border-secondary` — Subtle dividers

---

## For Plugin Developers

When creating or reviewing code, always:

1. **Check design token usage** — Use CSS variables, not hardcoded colors
2. **Verify accessibility** — Focus states, contrast, screen readers
3. **Apply warm neutrals** — Avoid pure black/white
4. **Use subtle borders** — 40% opacity default, never brand color
5. **Match brand voice** — Steward, not advisor

---

*This reference is synced with BOS-3.0 at `/Users/alexbouhdary/Documents/GitHub/BOS-3.0`*
