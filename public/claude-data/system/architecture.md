# Brand OS 3.0 Architecture

This document describes the architecture of the Brand Operating System (BOS) 3.0. The platform serves as an AI-powered brand management interface, combining brand knowledge, collaborative workspaces, and multi-model AI capabilities.

## Overview

BOS 3.0 is a Next.js 16+ application with React 19, featuring:
- Multi-model AI integration (Claude, Perplexity)
- Brand knowledge management system
- Collaborative project spaces
- Comprehensive design system based on UUI tokens

## Directory Structure

```
BOS-3.0/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── chat/                 # Main AI chat endpoint
│   │   │   └── route.ts          # Streaming responses, tools, thinking
│   │   ├── related-questions/    # Follow-up question generation
│   │   └── suggestions/          # Search autocomplete
│   │
│   ├── brain/                    # Brand Brain Dashboard
│   │   ├── page.tsx              # Brain overview
│   │   ├── architecture/         # System architecture docs
│   │   ├── brand-identity/       # Brand identity & messaging
│   │   ├── components/           # Component library docs
│   │   ├── skills/               # AI skills & capabilities
│   │   │   └── actions.ts        # Server actions for skills
│   │   └── writing-styles/       # Voice & tone guidelines
│   │
│   ├── brand-hub/                # Brand Assets Hub
│   │   ├── page.tsx              # Hub overview
│   │   ├── art-direction/        # Visual direction guidelines
│   │   ├── colors/               # Color system
│   │   ├── design-tokens/        # Token documentation
│   │   ├── fonts/                # Typography
│   │   ├── guidelines/           # Usage guidelines
│   │   └── logo/                 # Logo variations
│   │
│   ├── spaces/                   # Collaboration Spaces
│   │   ├── page.tsx              # Spaces listing
│   │   └── [slug]/               # Individual space
│   │       ├── page.tsx          # Space dashboard
│   │       └── chat/
│   │           └── [threadId]/   # Threaded discussions
│   │
│   ├── demo/                     # Demo pages
│   │   └── loader/               # Brand loader demo
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (chat interface)
│   ├── globals.css               # Global styles
│   └── theme.css                 # Theme variables
│
├── components/                   # React Components
│   ├── brain/                    # Brain-specific components
│   │   ├── AddBrainResourceModal.tsx
│   │   ├── BrainSettingsModal.tsx
│   │   ├── MarkdownCodeViewer.tsx
│   │   └── TabSelector.tsx
│   │
│   ├── brand-hub/                # Brand hub components
│   │   ├── AddResourceModal.tsx
│   │   ├── BrandHubLayout.tsx
│   │   └── IconPickerModal.tsx
│   │
│   ├── chat/                     # Chat system components
│   │   ├── index.ts              # Barrel export
│   │   ├── ChatContent.tsx       # Main content area
│   │   ├── ChatHeader.tsx        # Header with controls
│   │   ├── ChatResponse.tsx      # Response rendering
│   │   ├── ChatTabNav.tsx        # Tab navigation
│   │   ├── FollowUpInput.tsx     # Input for follow-ups
│   │   ├── SourcesDrawer.tsx     # Sources panel
│   │   ├── ThinkingDisplay.tsx   # Extended thinking view
│   │   ├── RelatedQuestions.tsx  # Suggested follow-ups
│   │   ├── InlineCitation.tsx    # Citation chips
│   │   ├── SourcePopover.tsx     # Source preview
│   │   ├── ToolExecutionCard.tsx # Tool use display
│   │   └── ShareModal.tsx        # Share functionality
│   │
│   ├── home/                     # Home page components
│   │   ├── index.ts
│   │   ├── WelcomeHeader.tsx
│   │   ├── PrePromptGrid.tsx
│   │   ├── AnimatedFolder.tsx
│   │   └── IconHover3D.tsx
│   │
│   ├── spaces/                   # Spaces components
│   │   ├── index.ts
│   │   ├── CreateSpaceModal.tsx
│   │   ├── SpaceChatInput.tsx
│   │   ├── SpaceResourceCards.tsx
│   │   ├── AddFilesModal.tsx
│   │   ├── AddLinksModal.tsx
│   │   ├── AddTasksModal.tsx
│   │   └── AddInstructionsModal.tsx
│   │
│   ├── ui/                       # Design System
│   │   ├── base/                 # Primitive components
│   │   │   ├── avatar/
│   │   │   ├── badges/
│   │   │   ├── buttons/
│   │   │   ├── input/
│   │   │   ├── select/
│   │   │   ├── textarea/
│   │   │   └── tooltip/
│   │   ├── foundations/          # Icons & primitives
│   │   ├── index.ts              # Barrel export
│   │   ├── Modal.tsx
│   │   ├── model-selector.tsx
│   │   ├── writing-style-selector.tsx
│   │   ├── connector-dropdown.tsx
│   │   ├── extended-thinking-toggle.tsx
│   │   ├── brand-loader.tsx
│   │   └── dot-loader.tsx
│   │
│   ├── Sidebar.tsx               # Main navigation
│   ├── TopHeader.tsx             # Top bar
│   ├── ChatInterface.tsx         # Main chat container
│   ├── SearchModal.tsx           # Global search
│   ├── ThemeToggle.tsx           # Dark/light mode
│   ├── Breadcrumbs.tsx           # Navigation breadcrumbs
│   └── BrandSelector.tsx         # Brand context selector
│
├── hooks/                        # Custom React Hooks
│   ├── useChat.ts                # Chat state & logic
│   ├── useSpaces.ts              # Spaces management
│   ├── useSpaceDiscussions.ts    # Space threads
│   ├── useAttachments.ts         # File handling
│   ├── useVoiceRecognition.ts    # Voice input
│   ├── useKeyboardShortcuts.ts   # Keyboard navigation
│   ├── useSearchSuggestions.ts   # Autocomplete
│   ├── useBrainResources.ts      # Brain resources
│   ├── useResources.ts           # Generic resources
│   └── use-resize-observer.ts    # Layout utilities
│
├── lib/                          # Core Libraries
│   ├── ai/                       # AI Provider System
│   │   ├── providers.ts          # Model configs & SDK clients
│   │   ├── auto-router.ts        # Intelligent model selection
│   │   └── tools/
│   │       ├── index.ts          # Tool definitions
│   │       └── executors.ts      # Tool execution logic
│   │
│   ├── brand-knowledge/          # Brand Context System
│   │   ├── index.ts              # Barrel export
│   │   ├── system-prompt.ts      # Build brand-aware prompts
│   │   ├── brand-docs.ts         # Documentation loader
│   │   ├── asset-manifest.ts     # Asset registry
│   │   ├── page-routes.ts        # Route definitions
│   │   ├── types.ts              # Type definitions
│   │   └── generate.ts           # Index generator script
│   │
│   ├── supabase/                 # Database Services
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── types.ts              # Database types
│   │   ├── chat-service.ts       # Chat persistence
│   │   ├── artifact-service.ts   # Artifact storage
│   │   ├── file-service.ts       # File management
│   │   ├── tool-service.ts       # Tool configs
│   │   ├── projects-service.ts   # Project management
│   │   └── mcp-service.ts        # MCP integration
│   │
│   ├── stores/                   # Zustand State Stores
│   │
│   ├── breadcrumb-context.tsx    # Breadcrumb state
│   ├── chat-context.tsx          # Chat state context
│   ├── sidebar-context.tsx       # Sidebar state
│   ├── mobile-menu-context.tsx   # Mobile navigation
│   ├── theme-provider.tsx        # Theme context
│   ├── motion.tsx                # Animation utilities
│   ├── utils.ts                  # General utilities
│   ├── mock-data.ts              # Development data
│   └── component-registry.ts     # Component docs
│
├── types/                        # TypeScript Definitions
│   ├── index.ts                  # Main type exports
│   └── d3-force-3d.d.ts          # D3 types
│
├── public/                       # Static Assets
│   ├── assets/                   # Brand assets
│   │   ├── fonts/                # Neue Haas Grotesk, Offbit
│   │   ├── logos/                # Logo variations
│   │   ├── icons/                # Icon library
│   │   └── textures/             # Background textures
│   │
│   ├── claude-data/              # AI-readable content
│   │   ├── knowledge/            # Brand documentation
│   │   └── system/               # System configuration
│   │
│   ├── data/                     # Generated content
│   │   └── discover/             # Article data
│   │
│   └── styles/                   # Additional styles
│
├── scripts/                      # Build & Generation Scripts
│   ├── populate-thumbnails.ts    # Thumbnail generation
│   └── capture-screenshots.ts    # Screenshot capture
│
├── supabase/                     # Database Configuration
│   └── migrations/               # SQL migrations
│
├── tailwind.config.ts            # Tailwind configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Core Systems

### 1. AI Provider System (`lib/ai/`)

The AI system supports multiple providers with intelligent routing:

**Models Available:**
- `claude-sonnet` - Claude Sonnet 4 (balanced, everyday tasks)
- `claude-opus` - Claude Opus 4 (most capable, complex reasoning)
- `sonar` - Perplexity Sonar (web search, current info)
- `sonar-pro` - Perplexity Sonar Pro (advanced search)
- `auto` - Automatic model selection based on query

**Features:**
- **Extended Thinking**: Deep reasoning with visible thought process
- **Tool Use**: Web search with citations and source attribution
- **Streaming**: Real-time token-by-token response display
- **Writing Styles**: Adaptable voice (learning, concise, creative, etc.)

**Architecture:**
```typescript
// providers.ts - Model configuration
const models = {
  'claude-sonnet': { provider: 'anthropic', supportsThinking: true },
  'claude-opus': { provider: 'anthropic', supportsThinking: true },
  'sonar': { provider: 'perplexity', supportsThinking: false },
};

// auto-router.ts - Smart model selection
function autoSelectModel(messages) {
  // Analyzes query complexity, length, needs
  // Returns optimal model for the task
}
```

### 2. Brand Knowledge System (`lib/brand-knowledge/`)

Enriches AI responses with brand context:

**Components:**
- **System Prompt Builder**: Constructs brand-aware prompts
- **Brand Documentation**: Identity, messaging, voice guidelines
- **Asset Manifest**: Logo, color, typography references
- **Page Context**: Current page/space awareness

**Integration:**
```typescript
// Building a brand-aware system prompt
const systemPrompt = buildBrandSystemPrompt({
  includeFullDocs: shouldIncludeFullDocs(messages),
  context: { type: 'space', spaceId: '...' },
});
```

### 3. Database Services (`lib/supabase/`)

Supabase-powered persistence layer:

**Services:**
- `chat-service.ts` - Message history and conversations
- `artifact-service.ts` - Generated artifacts storage
- `file-service.ts` - File uploads and management
- `projects-service.ts` - Project/space management
- `tool-service.ts` - Tool configurations

### 4. State Management

**Contexts:**
- `chat-context.tsx` - Active chat state
- `sidebar-context.tsx` - Navigation state
- `breadcrumb-context.tsx` - Navigation trail

**Zustand Stores:**
- Global application state
- Persisted user preferences

### 5. Design System (`components/ui/`)

Built on React Aria Components for accessibility:

**Base Components:**
- Avatar system with variants
- Button variants (primary, secondary, ghost, destructive)
- Input components (text, payment, grouped)
- Select components (single, multi, combobox)
- Badges and tags
- Tooltips

**Feature Components:**
- Model selector
- Writing style selector
- Connector dropdown
- Extended thinking toggle
- Custom loaders (brand, dot)

**Design Tokens (via CSS Variables):**
```css
/* Semantic tokens */
--bg-primary, --bg-secondary, --bg-tertiary
--fg-primary, --fg-secondary, --fg-tertiary
--border-primary, --border-brand
--button-primary-bg, --button-secondary-bg

/* Brand primitives */
--color-brand-500 (Aperol: #FE5102)
--color-gray-50 through --color-gray-950
```

## Data Flow

### Chat Request Flow

```
User Input
    ↓
ChatInterface.tsx
    ↓
useChat.ts hook
    ↓
/api/chat (POST)
    ↓
┌─────────────────────────────────────────┐
│  1. Parse request (messages, model)     │
│  2. Build brand system prompt           │
│  3. Process attachments                 │
│  4. Select provider (Anthropic/Perplexity)│
│  5. Stream response with:               │
│     - Extended thinking (if enabled)    │
│     - Tool use (web search)             │
│     - Source citations                  │
└─────────────────────────────────────────┘
    ↓
SSE Stream → Client
    ↓
ChatResponse.tsx (renders chunks)
```

### Space Context Flow

```
Space Page Load
    ↓
useSpaces() hook
    ↓
Load space data (files, links, instructions, tasks)
    ↓
SpaceContext injected into system prompt
    ↓
AI responses aware of:
  - Attached files
  - Linked resources
  - Custom instructions
  - Active tasks
```

## API Endpoints

### `/api/chat` (POST)
Main AI conversation endpoint.

**Request:**
```typescript
{
  messages: Message[],
  model?: 'auto' | 'claude-sonnet' | 'claude-opus' | 'sonar' | 'sonar-pro',
  context?: PageContext,
  connectors?: { web: boolean, brand: boolean, brain: boolean },
  options?: {
    enableThinking?: boolean,
    thinkingBudget?: number,
    enableTools?: boolean,
    writingStyle?: string,
  },
  extendedThinking?: boolean,
  writingStyle?: string,
}
```

**Response:** Server-Sent Events (SSE) stream
```typescript
type StreamChunk =
  | { type: 'thinking', content: string }
  | { type: 'text', content: string }
  | { type: 'tool_use', toolName: string, toolInput: object }
  | { type: 'tool_result', toolName: string, toolResult: any }
  | { type: 'sources', sources: Source[] }
  | { type: 'done' }
  | { type: 'error', error: string }
```

### `/api/related-questions` (POST)
Generates follow-up question suggestions.

### `/api/suggestions` (POST)
Returns search autocomplete suggestions.

## Key Design Decisions

### 1. Multi-Model Architecture
- **Why**: Different tasks need different capabilities
- **How**: Auto-router analyzes queries and selects optimal model
- **Benefit**: Best results without user configuration

### 2. Brand-Aware System Prompts
- **Why**: Consistent brand voice across all AI interactions
- **How**: Dynamic prompt building with context injection
- **Benefit**: AI understands and respects brand guidelines

### 3. React Aria Components
- **Why**: First-class accessibility support
- **How**: Built on Adobe's accessible component library
- **Benefit**: WCAG compliance out of the box

### 4. CSS Variable Design Tokens
- **Why**: Theme flexibility and consistency
- **How**: Semantic tokens mapped to CSS variables
- **Benefit**: Easy theme switching, dark mode support

### 5. Server-Sent Events for Streaming
- **Why**: Real-time response display
- **How**: SSE stream with typed chunks
- **Benefit**: Progressive rendering, better UX

## Integration Points

- **Anthropic API**: Claude models for reasoning
- **Perplexity API**: Sonar models for web search
- **Supabase**: Database and file storage
- **Vercel**: Hosting and analytics
- **Figma**: Design system source of truth

## Development Workflow

1. **Local Development**: `bun dev` or `npm run dev`
2. **Type Checking**: TypeScript strict mode
3. **Linting**: ESLint with Next.js config
4. **Brand Index**: `bun run generate:brand-index`
5. **Production Build**: `bun run build`

---

*Last Updated: December 2024*
*Version: 3.0*
