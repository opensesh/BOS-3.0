# Brand Operating System (BOS) 3.0

A modern AI-powered brand management platform built with Next.js 16+, React 19, TypeScript, and Tailwind CSS. Features multi-model AI integration with Claude and Perplexity, brand knowledge systems, and collaborative workspaces.

## 🚀 Features

### AI Integration
- **Multi-Model Support**: Claude Sonnet 4, Claude Opus 4, Perplexity Sonar
- **Extended Thinking**: Deep reasoning capabilities with Claude models
- **Web Search**: Real-time web grounding via Perplexity Sonar
- **Auto-Routing**: Intelligent model selection based on query complexity
- **Tool Use**: Web search, citations, and source attribution
- **Writing Styles**: Learning, Concise, Explanatory, Creative, Formal, and more

### Brand Management
- **Brain Dashboard**: Centralized brand intelligence
  - Brand Identity & Messaging
  - Writing Styles & Voice Guidelines
  - Component Library
  - Architecture Documentation
  - Skills & Capabilities
- **Brand Hub**: Asset management
  - Logo variations and usage
  - Color system with design tokens
  - Typography (Neue Haas Grotesk, Offbit)
  - Art Direction guidelines
  - Design Tokens export

### Collaboration
- **Spaces**: Project-focused workspaces
  - File attachments
  - Link collections
  - Custom instructions
  - Task management
  - Threaded discussions

### Modern Tech Stack
- **Framework**: Next.js 16+ with App Router
- **UI**: React 19 with React Aria Components for accessibility
- **Styling**: Tailwind CSS with UUI semantic tokens
- **State**: Zustand for global state management
- **Database**: Supabase for persistence
- **Animation**: Framer Motion & GSAP
- **Analytics**: Vercel Analytics & Speed Insights

## 🎨 Design System

### Colors (BRAND-OS)
| Token | Value | Usage |
|-------|-------|-------|
| Charcoal | `#191919` | Dark backgrounds |
| Vanilla | `#FFFAEE` | Light/cream accents |
| Aperol | `#FE5102` | Primary brand color |

### Typography
- **Primary**: Neue Haas Grotesk Display Pro
- **Accent**: Offbit (monospace/display)
- **System Fallback**: system-ui, sans-serif

### Component Library
Built on React Aria Components for full accessibility:
- Buttons, Inputs, Textareas
- Select, Combobox, Multi-select
- Avatars, Badges, Tags
- Tooltips, Modals, Popovers
- Custom loaders and transitions

## 📦 Installation

```bash
# Install dependencies (using Bun recommended)
bun install
# or
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys:
# - ANTHROPIC_API_KEY
# - PERPLEXITY_API_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY

# Run development server
bun dev
# or
npm run dev

# Build for production
bun run build

# Start production server
bun start
```

## 🏗️ Project Structure

```
BOS-3.0/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── chat/                 # AI chat endpoint
│   │   ├── related-questions/    # Follow-up suggestions
│   │   └── suggestions/          # Search suggestions
│   ├── brain/                    # Brand brain dashboard
│   │   ├── architecture/
│   │   ├── brand-identity/
│   │   ├── components/
│   │   ├── skills/
│   │   └── writing-styles/
│   ├── brand-hub/                # Brand assets hub
│   │   ├── art-direction/
│   │   ├── colors/
│   │   ├── design-tokens/
│   │   ├── fonts/
│   │   ├── guidelines/
│   │   └── logo/
│   ├── spaces/                   # Collaboration spaces
│   │   └── [slug]/
│   │       └── chat/[threadId]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── theme.css
├── components/                   # React components
│   ├── brain/                    # Brain page components
│   ├── brand-hub/                # Brand hub components
│   ├── chat/                     # Chat interface components
│   │   ├── ChatContent.tsx
│   │   ├── ChatResponse.tsx
│   │   ├── FollowUpInput.tsx
│   │   ├── SourcesDrawer.tsx
│   │   └── ThinkingDisplay.tsx
│   ├── home/                     # Home page components
│   ├── spaces/                   # Spaces components
│   ├── ui/                       # Design system
│   │   ├── base/                 # Primitive components
│   │   │   ├── avatar/
│   │   │   ├── badges/
│   │   │   ├── buttons/
│   │   │   ├── input/
│   │   │   ├── select/
│   │   │   ├── textarea/
│   │   │   └── tooltip/
│   │   └── *.tsx                 # Feature components
│   ├── Sidebar.tsx
│   ├── TopHeader.tsx
│   └── ChatInterface.tsx
├── hooks/                        # Custom React hooks
│   ├── useChat.ts
│   ├── useSpaces.ts
│   ├── useAttachments.ts
│   ├── useVoiceRecognition.ts
│   └── useKeyboardShortcuts.ts
├── lib/                          # Utilities & services
│   ├── ai/                       # AI provider configuration
│   │   ├── providers.ts          # Model configs & clients
│   │   ├── auto-router.ts        # Smart model selection
│   │   └── tools/                # Tool definitions
│   ├── brand-knowledge/          # Brand context system
│   │   ├── system-prompt.ts
│   │   ├── brand-docs.ts
│   │   └── asset-manifest.ts
│   ├── supabase/                 # Database services
│   │   ├── chat-service.ts
│   │   ├── file-service.ts
│   │   └── projects-service.ts
│   └── stores/                   # Zustand stores
├── public/
│   ├── assets/                   # Static assets
│   │   ├── fonts/
│   │   ├── logos/
│   │   └── icons/
│   ├── claude-data/              # AI-readable content
│   └── data/                     # Generated content
├── types/                        # TypeScript definitions
└── supabase/                     # Database migrations
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Focus search input |
| `Enter` | Submit query |
| `Shift + Enter` | New line in textarea |
| `Escape` | Close modal / blur input |

## 🔧 Configuration

### AI Models
Configure in `lib/ai/providers.ts`:

```typescript
const models = {
  'claude-sonnet': { provider: 'anthropic', supportsThinking: true },
  'claude-opus': { provider: 'anthropic', supportsThinking: true },
  'sonar': { provider: 'perplexity', supportsThinking: false },
  'sonar-pro': { provider: 'perplexity', supportsThinking: false },
};
```

### Tailwind Theme
Customize in `tailwind.config.ts`:

```typescript
colors: {
  brand: {
    charcoal: '#191919',
    vanilla: '#FFFAEE',
    aperol: '#FE5102',
  },
  // UUI semantic tokens via CSS variables
  bg: { primary: 'var(--bg-primary)', ... },
  fg: { primary: 'var(--fg-primary)', ... },
}
```

### Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Optional
VERCEL_ANALYTICS_ID=...

# MCP (for GitHub integration)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
```

## 🔌 MCP Servers (Claude Code)

This project uses [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers to extend Claude Code's capabilities with direct access to external services.

### Required Servers

| Server | Purpose | Auth |
|--------|---------|------|
| **Supabase** | Database, migrations, edge functions | OAuth |
| **Vercel** | Deployments, logs, projects | OAuth |
| **Figma** | Design context, screenshots | OAuth |
| **Notion** | Documentation, databases | OAuth |
| **GitHub** | Repository, issues, PRs | PAT |

### Quick Setup

```bash
# Add OAuth servers (browser auth)
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp" --scope user
claude mcp add --transport http vercel "https://mcp.vercel.com" --scope user
claude mcp add --transport http figma "https://mcp.figma.com/mcp" --scope user
claude mcp add --transport http notion "https://mcp.notion.com/mcp" --scope user

# Add GitHub (requires GITHUB_PERSONAL_ACCESS_TOKEN in shell profile)
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"}}' --scope user

# Verify all connected
claude mcp list
```

For detailed setup instructions, see [`.claude/mcp-instructions.md`](.claude/mcp-instructions.md).

## 🚀 Scripts

```bash
# Development
bun dev                           # Start dev server

# Build
bun run build                     # Production build
bun start                         # Start production server

# Utilities
bun run lint                      # Run ESLint
bun run generate:brand-index      # Generate brand knowledge index
bun run fetch-thumbnails          # Populate article thumbnails
bun run capture-screenshots       # Capture component screenshots
```

## 🎯 Key Features Deep Dive

### AI Chat System
- **Streaming responses** with real-time token display
- **Extended thinking** visualization with collapsible blocks
- **Source citations** with favicon and snippet previews
- **Follow-up questions** auto-generated based on context
- **Image attachments** with drag-and-drop support
- **Writing style** presets for different content types

### Brand Knowledge Integration
- System prompts enriched with brand documentation
- Contextual awareness of current page/space
- Asset references and brand guideline compliance
- Voice and tone consistency checks

### Spaces & Collaboration
- Create focused project workspaces
- Attach files, links, and instructions
- Threaded discussions with full history
- Task management integration
- Context-aware AI responses within spaces

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Stream AI responses |
| `/api/suggestions` | POST | Get search suggestions |
| `/api/related-questions` | POST | Generate follow-ups |

## 🔐 Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader support
- High contrast support
- Reduced motion preferences

## 📝 License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE). This means you're free to use, modify, and distribute this software, but any modifications must also be open-sourced under the same license—including when running the software as a network service.

## 🤝 Contributing

This is a work-in-progress project. Suggestions and feedback are welcome!

---

Built with ❤️ using BRAND-OS design system by [OPEN SESSION](https://opensesh.com)
