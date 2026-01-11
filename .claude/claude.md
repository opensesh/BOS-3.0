# BOS 3.0 - Design System Guidelines

## Border & Outline Styling

### Core Principle
**Avoid harsh white or brand-colored outlines** that visually dominate the page. Borders should be subtle and supportive, not attention-grabbing.

### Border Hierarchy

1. **Default State** - Nearly invisible borders
   ```css
   border border-[var(--border-primary)]/40
   ```

2. **Hover State** - Slightly more visible, but still subtle
   ```css
   hover:border-[var(--border-primary)]
   ```

3. **Focus State** - Use the primary border, NOT brand color
   ```css
   focus:border-[var(--border-primary)]
   ```

### ❌ NEVER DO THIS
```css
/* Too harsh - creates visual noise */
border-[var(--border-brand-solid)]
border-white
border-2
focus:border-[var(--border-brand-solid)]
focus:ring-2 ring-[var(--bg-brand-solid)]
```

### ✅ INSTEAD DO THIS
```css
/* Subtle, supportive borders */
border border-[var(--border-primary)]/40
hover:border-[var(--border-primary)]
focus:border-[var(--border-primary)]
```

### Card Styling Pattern
Cards throughout the app follow this pattern:
```css
bg-[var(--bg-secondary)]/30
border border-[var(--border-primary)]/40
hover:bg-[var(--bg-secondary)]/60
hover:border-[var(--border-primary)]
```

### Input Styling Pattern
Inputs use subtle borders that become slightly more visible on focus:
```css
bg-[var(--bg-secondary)]/30
border border-[var(--border-primary)]/40
focus:border-[var(--border-primary)]
focus:bg-[var(--bg-secondary)]/50
```

### Button Styling (Active States)
For toggle buttons and active filter states, use background changes not border changes:
```css
/* Inactive */
text-[var(--fg-tertiary)]
hover:bg-[var(--bg-secondary)]/50

/* Active */
bg-[var(--bg-tertiary)]
text-[var(--fg-primary)]
```

## Color Usage

### Brand Colors
Brand colors (`--fg-brand-primary`, `--bg-brand-solid`) should be used sparingly for:
- Primary action buttons (Submit, Send, etc.)
- Type badges and labels (small elements)
- Accent highlights on important elements
- NOT for borders or outlines

### Semantic Colors
- Success: `text-emerald-500`
- Warning: `text-amber-500`
- Error: `text-red-500`
- Info: Use `--fg-brand-primary`

## Interactive Elements

### Hover Reveals
Use opacity transitions for hover-revealed actions:
```css
opacity-0 group-hover:opacity-100 transition-opacity duration-150
```

### Overflow Menus
Place overflow menus (3-dot menus) in the bottom-right corner of cards to avoid overlap with badges.

## Accessibility Notes
- Ensure sufficient color contrast in both light and dark themes
- Focus states should be visible but not jarring
- Use `border-[var(--border-primary)]` for focus (visible but not harsh)
