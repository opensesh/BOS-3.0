# Brand Operating System (BOS) 3.0 Architecture

> **Living documentation** — Auto-updated: 2026-01-05
>
> This document is auto-generated but provides high-level architectural guidance.
> It's designed to help AI agents, developers, and MCP tools navigate the codebase.

---

## What is BOS?

BOS (Brand Operating System) is an AI-powered brand management platform. It combines:

- **Multi-model AI chat** with Claude (Anthropic) and Perplexity integration
- **Brand knowledge system** that enriches AI responses with brand context
- **Collaborative workspaces** for projects and team spaces
- **Living documentation** for brand guidelines and assets

The platform serves both as a user-facing application AND as a well-structured resource for AI interpretation.

---

## Quick Reference

| Metric | Count |
|--------|-------|
| **Version** | 3.0.0 |
| **Pages** | 21 |
| **API Endpoints** | 14 |
| **Source Files** | ~281 |
| **Lines of Code** | ~77,221 |

---

## Directory Structure

```
BOS-3.0/
├── app/                    # Next.js App Router pages
│   ├── api/                # API route handlers
│   ├── brain/              # Brand Brain documentation pages
│   ├── brand-hub/          # Brand asset management pages
│   ├── projects/           # Project workspaces
│   ├── spaces/             # Collaboration spaces
│   └── page.tsx            # Home (main chat interface)
│
├── components/             # React components
│   ├── chat/               # Chat system (responses, citations, tools)
│   ├── brain/              # Brain-specific components
│   ├── brand-hub/          # Brand hub components
│   ├── home/               # Home page components
│   ├── projects/           # Project management components
│   ├── spaces/             # Space collaboration components
│   ├── settings/           # User settings forms
│   ├── mobile/             # Mobile-specific components
│   └── ui/                 # Design system primitives
│
├── hooks/                  # Custom React hooks
├── lib/                    # Core libraries
│   ├── ai/                 # AI provider system
│   ├── brand-knowledge/    # Brand context system
│   └── supabase/           # Database services
│
├── public/
│   ├── claude-data/        # AI-readable content & docs
│   └── assets/             # Static brand assets
│
└── types/                  # TypeScript definitions
```

---

## Core Systems

### 1. AI Provider System (`lib/ai/`)

The AI system supports multiple providers with intelligent routing:

**Available Models:**
- `claude-sonnet` — Claude Sonnet 4 (balanced, everyday tasks)
- `claude-opus` — Claude Opus 4 (complex reasoning, extended thinking)
- `sonar` / `sonar-pro` — Perplexity Sonar (web search, current info)
- `auto` — Automatic model selection based on query analysis

**Key Features:**
- **Extended Thinking**: Claude models can show their reasoning process
- **Tool Use**: Web search with citation attribution
- **Streaming**: Real-time token-by-token response display
- **Writing Styles**: Adaptable voice (concise, creative, learning, etc.)

**Architecture Pattern:**
```
User Query → Auto-Router → Provider Selection → Stream Response
                ↓
         Analyzes: query complexity, length, search needs
                ↓
         Returns: optimal model for the task
```

### 2. Brand Knowledge System (`lib/brand-knowledge/`)

Enriches every AI response with brand context:

- **System Prompt Builder**: Constructs brand-aware prompts dynamically
- **Brand Documentation**: Identity, messaging, voice guidelines
- **Asset Manifest**: Logo, color, typography references
- **Page Context**: Current page/space awareness injected into prompts

**When to use:** Any AI interaction should include brand context via `buildBrandSystemPrompt()`.

### 3. Database Services (`lib/supabase/`)

Supabase-powered persistence:

| Service | Purpose |
|---------|---------|
| `chat-service.ts` | Message history, conversations |
| `artifact-service.ts` | Generated code/content storage |
| `file-service.ts` | File uploads and management |
| `projects-service.ts` | Project/workspace management |
| `tool-service.ts` | Tool configurations |

### 4. State Management

**React Contexts:**
- `chat-context.tsx` — Active chat state, messages, streaming
- `sidebar-context.tsx` — Navigation state, collapse/expand
- `breadcrumb-context.tsx` — Navigation trail
- `mobile-menu-context.tsx` — Mobile navigation state

**Zustand Stores:** Used for global application state and persisted preferences.

### 5. Design System (`components/ui/`)

Built on **React Aria Components** for accessibility:

- Base primitives: Avatar, Button, Input, Select, Textarea, Tooltip
- Semantic tokens via CSS variables
- Full dark/light theme support
- WCAG compliance out of the box

---

## Pages & Their Purpose

| `/` | Page content |
| `/account` | User account settings and profile management |
| `/brain` | Brand Brain dashboard overview |
| `/brain/architecture` | System architecture documentation (this page) |
| `/brain/brand-identity` | Brand identity and messaging guidelines |
| `/brain/skills` | AI skills and capabilities configuration |
| `/brain/writing-styles` | Voice and tone guidelines |
| `/brand-hub` | Brand assets hub overview |
| `/brand-hub/art-direction` | Visual direction guidelines |
| `/brand-hub/colors` | Color system and palette |
| `/brand-hub/design-tokens` | Design token documentation |
| `/brand-hub/fonts` | Typography system |
| `/brand-hub/guidelines` | Brand usage guidelines |
| `/brand-hub/logo` | Logo variations and usage |
| `/chats` | Chat history and saved conversations |
| `/demo/loader` | Brand loader component demo |
| `/projects` | Project workspaces listing |
| `/projects/:id` | Individual project workspace with files and chat |
| `/spaces` | Collaboration spaces listing |
| `/spaces/:slug` | Individual space dashboard |
| `/spaces/:slug/chat/:threadId` | Threaded discussion within a space |

---

## API Reference

### `GET, POST, PUT, DELETE /api/brain/documents`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`

### `GET, POST /api/brain/guided-input`

**Purpose:** API endpoint

**Request:** `{ messages, model?, context?, connectors?, options? }`

**Response:** `JSON response`

### `GET, POST /api/brain/seed`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`

### `GET, POST /api/brain/versions`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`

### `GET /api/brand`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`

### `POST /api/chat`

**Purpose:** Main AI conversation endpoint with streaming responses

**Request:** `{ messages, model?, context?, connectors?, options? }`

**Response:** `SSE stream: thinking | text | tool_use | sources | done`

### `POST /api/embed-message`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`

### `POST /api/generate-title`

**Purpose:** Generate conversation titles from messages

**Request:** `{ messages, model?, context?, connectors?, options? }`

**Response:** `{ title: string }`

### `POST /api/related-questions`

**Purpose:** Generate follow-up question suggestions

**Request:** `{ messages, model?, context?, connectors?, options? }`

**Response:** `{ questions: string[] }`

### `GET, POST /api/search`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`

### `GET, POST /api/suggestions`

**Purpose:** Search autocomplete suggestions

**Request:** `{ messages, model?, context?, connectors?, options? }`

**Response:** `{ suggestions: string[] }`

### `POST /api/summarize-thinking`

**Purpose:** Summarize extended thinking content

**Request:** `{ messages, model?, context?, connectors?, options? }`

**Response:** `{ summary: string }`

### `GET /api/test-env`

**Purpose:** Environment variable testing (dev only)

**Request:** `{ query }`

**Response:** `JSON response`

### `GET, POST /api/upload-attachment`

**Purpose:** API endpoint

**Request:** `{ query }`

**Response:** `JSON response`


---

## Data Flow Patterns

### Chat Request Flow

```
User Input (ChatInterface.tsx)
       ↓
useChat() hook prepares request
       ↓
POST /api/chat
       ↓
┌─────────────────────────────────────────────┐
│ 1. Parse request (messages, model, context) │
│ 2. Build brand system prompt                │
│ 3. Process any attachments                  │
│ 4. Auto-select provider if model="auto"     │
│ 5. Stream response with:                    │
│    - Extended thinking (if enabled)         │
│    - Tool use (web search)                  │
│    - Source citations                       │
└─────────────────────────────────────────────┘
       ↓
SSE Stream → ChatResponse.tsx renders chunks
```

### Space Context Flow

```
Space Page Load → useSpaces() hook
       ↓
Load space data: files, links, instructions, tasks
       ↓
Space context injected into system prompt
       ↓
AI responses become aware of:
  • Attached files & their contents
  • Linked resources
  • Custom instructions
  • Active tasks
```

---

## Key Design Decisions

| Decision | Why | Benefit |
|----------|-----|---------|
| **Multi-model routing** | Different tasks need different capabilities | Best results without user config |
| **Brand-aware prompts** | Consistent voice across all AI interactions | AI respects brand guidelines |
| **React Aria Components** | First-class accessibility | WCAG compliance built-in |
| **CSS variable tokens** | Theme flexibility | Easy dark mode, theming |
| **Server-Sent Events** | Real-time streaming | Progressive rendering, better UX |

---

## For AI Agents & MCP Tools

### Navigating the Codebase

1. **To find a page's implementation**: Check `app/[route]/page.tsx`
2. **To find a component**: Check `components/[category]/[ComponentName].tsx`
3. **To understand an API**: Check `app/api/[endpoint]/route.ts`
4. **To find business logic**: Check `lib/[system]/` directories
5. **To find React hooks**: Check `hooks/use[Name].ts`

### Common Operations

| Task | Where to Look |
|------|---------------|
| Add a new page | `app/[new-route]/page.tsx` |
| Add a new API | `app/api/[endpoint]/route.ts` |
| Modify chat behavior | `lib/ai/providers.ts`, `app/api/chat/route.ts` |
| Update brand context | `lib/brand-knowledge/` |
| Add UI component | `components/ui/` for primitives, `components/[feature]/` for features |
| Modify database | `lib/supabase/[service].ts`, `supabase/migrations/` |

### Integration Points

- **Anthropic API**: Claude models (`@anthropic-ai/sdk`)
- **Perplexity API**: Sonar models for web search
- **Supabase**: Database, auth, file storage
- **Vercel**: Hosting, analytics, speed insights

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js ^16.1.1 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + CSS Variables |
| UI Library | React Aria Components |
| State | React Context + Zustand |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude, Perplexity Sonar |
| Animations | Framer Motion, GSAP |

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run generate:architecture` | Regenerate this document |
| `npm run generate:brand-index` | Rebuild brand knowledge index |

---

<sub>Auto-generated by `scripts/generate-architecture.ts` — 2026-01-05T02:20:20.736Z</sub>
