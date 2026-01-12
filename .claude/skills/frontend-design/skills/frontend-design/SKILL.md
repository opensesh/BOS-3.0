---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces aligned with BOS design principles. Generates polished code with intentional aesthetics that feel designed, not auto-generated.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that feel genuinely designed. When working on BOS-3.0 projects, it automatically applies our warm neutrals philosophy and brand tokens.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about purpose, audience, or technical constraints.

---

## Design Thinking (For Designers)

Before writing any code, take a moment to establish your **design intent**:

### 1. Purpose & Context
*What problem are we solving? Who uses this?*

Think about the user's emotional state, their goals, and what success looks like.

### 2. Aesthetic Direction
Choose a clear visual direction. Some starting points:

| Direction | Feel | When to Use |
|-----------|------|-------------|
| **Warm Minimal** | Clean, inviting, focused | Dashboard UIs, tools, productivity |
| **Editorial** | Magazine-like, typographic | Content-heavy pages, portfolios |
| **Soft/Organic** | Rounded, gentle, approachable | Consumer apps, onboarding |
| **Industrial/Raw** | Utilitarian, honest, functional | Developer tools, technical docs |
| **Luxury/Refined** | Spacious, elegant, deliberate | Brand sites, premium products |

**Key insight**: Bold maximalism and refined minimalism both work — the magic is in **commitment**, not intensity.

### 3. The Memorable Detail
Ask yourself: *What's the one thing someone will remember about this interface?*

Maybe it's a delightful hover state, an unexpected color choice, or how perfectly the typography flows.

---

## BOS Design System Integration

When building for BOS-3.0, use our design tokens:

### Colors (Warm Neutrals)
```css
/* Primary Brand */
--brand-primary: #FE5102;  /* Aperol — CTAs, links, badges */

/* Warm Neutrals (NOT black/white) */
--charcoal: #191919;       /* Dark backgrounds, primary text */
--vanilla: #FFFAEE;        /* Light backgrounds, light text */

/* Usage */
--bg-primary, --bg-secondary, --bg-tertiary
--fg-primary, --fg-secondary, --fg-tertiary
--border-primary (at 40% opacity by default)
```

### Typography
- **Headings**: Neue Haas Grotesk Display Pro
- **Body**: Neue Haas Grotesk Display Pro
- **Accent/Display**: Offbit (for that digital, tech feel)
- **Code**: SF Mono, Consolas, Monaco

### Border Philosophy
Borders should **support, not dominate**:
```jsx
// Default: nearly invisible
className="border border-[var(--border-primary)]/40"

// Hover: slightly more visible
className="hover:border-[var(--border-primary)]"

// Focus: full visibility, but NOT brand color
className="focus:border-[var(--border-primary)]"
```

---

## Frontend Guidelines

### Typography Choices
- Avoid generic fonts (Arial, Inter, Roboto, system fonts)
- Choose fonts with **character** that match your aesthetic direction
- Pair a distinctive display font with a refined body font
- For BOS projects: Neue Haas + Offbit create our signature look

### Color Strategy
- **Dominant colors with sharp accents** beat timid, evenly-distributed palettes
- Use CSS variables for consistency
- For BOS: Aperol (#FE5102) is our accent — use sparingly for impact
- Never use brand colors for borders or harsh outlines

### Motion & Animation
Focus on **high-impact moments**:
- One well-choreographed page load beats scattered micro-interactions
- Use `animation-delay` for staggered reveals
- Scroll-triggered effects should surprise and delight
- For BOS projects, we use Framer Motion and GSAP

### Spatial Composition
Be intentional about space:
- Generous negative space creates breathing room
- Asymmetry and overlap create visual interest
- Grid-breaking elements draw attention
- Every element's position should feel considered

### Visual Details & Atmosphere
Create depth rather than flat surfaces:
- Gradient meshes, noise textures, geometric patterns
- Layered transparencies, dramatic shadows
- For BOS: shadows use Charcoal (25,25,25), not pure black

---

## What to Avoid

**Generic AI aesthetics include:**
- Overused fonts (Inter, Roboto, Arial)
- Purple gradients on white backgrounds
- Predictable layouts without context-specific character
- Cookie-cutter component patterns

**Instead:**
- Make unexpected choices that feel genuinely designed
- Match implementation complexity to your aesthetic vision
- Elegant minimalism needs restraint and precision
- Bold maximalism needs elaborate, layered effects

---

## Voice & Approach

When building interfaces, think like a **steward**:
- You're part of the team, not an external consultant
- Design choices should feel natural, not prescribed
- Explain your reasoning in simple terms
- Be confident in your aesthetic choices, but open to iteration

---

## Examples for BOS Projects

```jsx
// Card with BOS styling
<div className="
  bg-[var(--bg-secondary)]/30
  border border-[var(--border-primary)]/40
  hover:bg-[var(--bg-secondary)]/60
  rounded-xl
  transition-all duration-300
">
  {/* Content */}
</div>

// Button with Aperol accent
<button className="
  bg-[var(--brand-primary)]
  text-[var(--vanilla)]
  hover:bg-[var(--brand-primary)]/90
  rounded-lg px-4 py-2
  font-medium
">
  Get Started
</button>
```

---

*Remember: You're capable of extraordinary creative work. Commit fully to your vision and execute with precision.*
