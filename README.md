<div align="center">
  <img src="app/icon.png" alt="Flux Logo" width="80" height="80" />
  <h1>Flux</h1>
  <p><strong>Your AI-Powered Research Partner - Grounded in the information you trust.</strong></p>
  <p>An intelligent workspace for ingesting multimodal documents, performing hybrid-retrieval RAG, preserving cross-session memory, and generating active study artifacts.</p>

  <p>
    <a href="#architecture"><img src="https://img.shields.io/badge/Next.js-16.3.1-black?logo=next.js" alt="Next.js 16" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black" alt="React 19" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" /></a>
    <a href="#architecture"><img src="https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
    <a href="#architecture"><img src="https://img.shields.io/badge/Inngest-Durable_Execution-4338CA?logo=inngest&logoColor=white" alt="Inngest" /></a>
  </p>
</div>

---

## Overview

**Flux** is a research and knowledge synthesis platform designed to transform fragmented reference material into actionable, verifiable understanding. Instead of querying general purpose chatbots that hallucinate or rely on unvetted training data, Flux allows researchers, students, and engineers to create isolated workspaces populated with their own trusted sources: PDFs, presentations, spreadsheets, documents, web pages, and YouTube video lectures.

Flux processes these sources through a durable background ingestion pipeline, indexes them into a high-dimensional vector space using Pinecone, and delivers grounded answers via an advanced multi-stage RAG pipeline featuring Hypothetical Document Embeddings (HyDE) and Reciprocal Rank Fusion (RRF). Beyond conversational Q&A with strict source citations, Flux automatically synthesizes ingested sources into interactive learning artifacts, including flashcard decks, scored multiple-choice quizzes, hierarchical mind maps, executive summaries, and structured analytical reports.

---

## Architecture

The following diagram illustrates the end-to-end architecture of Flux, from user interaction to durable background execution and third-party AI/vector infrastructure:

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend & Client Layer (Next.js 16 App Router)"]
        UI["React 19 Server & Client Components"]
        Chat["Streaming Chat & Citations Viewer"]
        ArtifactsUI["Interactive Artifact Viewers (Flashcards, Quizzes, Mindmaps)"]
        SourceViews["Specialized Source Viewers (PDF, XLSX, PPTX, YouTube)"]
    end

    subgraph GatewayLayer["API & Middleware Layer"]
        Proxy["Next.js Middleware (Session Check & Route Protection)"]
        AuthModule["Better Auth (PostgreSQL Adapter, JWT Session Cookies)"]
        RateLimiter["Upstash Redis Sliding-Window Rate Limiter (with In-Memory Fallback)"]
        API["REST Route Handlers (/api/workspaces, /api/sources, /api/conversations, /api/memories)"]
    end

    subgraph ServiceLayer["Server Modules & Business Logic"]
        WorkspaceSvc["Workspace Service"]
        SourceSvc["Source Service & Document Parsers"]
        ConvSvc["Conversation Service & RAG Controller"]
        ArtifactSvc["Learning Artifact Service"]
        MemSvc["Memory Service"]
    end

    subgraph AsyncLayer["Durable Background Orchestration (Inngest)"]
        InngestServer["Inngest Dev / Cloud Server"]
        FnSource["process-source (Extract -> Chunk -> Embed -> Index)"]
        FnArtifact["generate-artifact (Zod Structured Generation)"]
        FnSummary["summarize-conversation (Rolling Summary & Mem0 Sync)"]
    end

    subgraph DataStorage["Data & Storage Infrastructure"]
        Postgres[("PostgreSQL via Drizzle ORM")]
        PineconeDB[("Pinecone Vector Database (512-dim Embeddings & Metadata)")]
        R2Storage[("Cloudflare R2 Object Storage (Presigned URLs)")]
    end

    subgraph ExternalAI["External AI & Data Services"]
        OpenAI["OpenAI (gpt-5.4-mini / gpt-5.4-nano / text-embedding-3-small)"]
        Mem0Platform["Mem0 Long-Term Memory Platform"]
        FirecrawlService["Firecrawl Web Scraping & Search"]
    end

    UI --> Proxy
    Proxy --> API
    API --> AuthModule
    API --> RateLimiter
    RateLimiter --> ServiceLayer

    ServiceLayer --> Postgres
    SourceSvc --> R2Storage
    SourceSvc -.->|Dispatch Events| InngestServer
    ConvSvc -.->|Dispatch Events| InngestServer
    ArtifactSvc -.->|Dispatch Events| InngestServer

    InngestServer --> FnSource
    InngestServer --> FnArtifact
    InngestServer --> FnSummary

    FnSource --> SourceSvc
    FnSource --> OpenAI
    FnSource --> PineconeDB
    FnSource --> Postgres

    FnArtifact --> ArtifactSvc
    FnArtifact --> OpenAI
    FnArtifact --> Postgres

    FnSummary --> ConvSvc
    FnSummary --> OpenAI
    FnSummary --> Mem0Platform
    FnSummary --> Postgres

    ConvSvc --> OpenAI
    ConvSvc --> PineconeDB
    ConvSvc --> Mem0Platform
    ConvSvc --> FirecrawlService
    ConvSvc --> Postgres
```

### Key Architectural Decisions

1. **Zero-Join Vector Retrieval**: Document chunk text is embedded directly within Pinecone vector metadata (`metadata.text`). When a RAG query completes, relevant excerpts and citation attributes are returned immediately from the vector index, bypassing secondary database queries and maximizing streaming responsiveness. Full chunk records and source content remain in PostgreSQL for inspection and re-indexing.
2. **Durable Multi-Step Ingestion**: Document processing operations (file fetching, text extraction, semantic chunking, batch embedding generation, and vector indexing) are wrapped in discrete Inngest steps. If an external API rate limit or transient network timeout occurs mid-file, the step retries independently without re-processing earlier steps.
3. **Resilient Rate Limiting**: The system utilizes an Upstash Redis sliding-window algorithm for client throttling on resource-intensive operations (document uploads, AI chat turns, artifact generation). If Upstash credentials are not configured, the service falls back automatically to an in-memory sliding-window store with automated cache expiration.
4. **Hierarchical Source Parsing**: Instead of treating all files as arbitrary plain text, Flux applies specialized extractors:
   - **PDFs**: Parsed via `unpdf`, keeping page boundaries intact to provide precise 1-based page citations.
   - **Spreadsheets (`.xlsx`)**: Extracted via `exceljs` into structured sheets and cell grids, preserving column/row relationships.
   - **Slide Decks (`.pptx`)**: Decomposed via `jszip` into structured slide objects containing titles and bullet hierarchies.
   - **Documents (`.docx`)**: Parsed via `mammoth` into clean raw text and preview HTML.
   - **YouTube Videos**: Ingested via `youtube-transcript` with automatic time-scale detection (milliseconds vs. seconds) and converted into timestamped Markdown.
   - **Web Articles**: Cleaned into Markdown via Firecrawl, removing ads, navigation menus, and boilerplate headers.

---

## Key Features

- **Multi-Source Ingestion Engine**:
  - File Uploads: PDF, DOCX, PPTX, XLSX, TXT, MD.
  - YouTube Integration: Transcript extraction with synchronized timestamped playback.
  - Web Crawler: Firecrawl-powered article extraction and web search.
  - Manual Text/Notes: Direct markdown and text source entry.
- **Advanced RAG Pipeline**:
  - Structured query rewriting and Hypothetical Document Embeddings (HyDE).
  - Parallel vector queries against 512-dimension `text-embedding-3-small` Pinecone indices.
  - Reciprocal Rank Fusion (RRF) with smoothing constant $k=60$.
  - Adjacent-chunk deduplication to prevent repetitive context.
  - Live web search tool fallback powered by Firecrawl.
- **Verifiable Citations**:
  - Every AI response embeds chunk metadata: source title, source type, chunk index, page number, and text excerpt.
  - Clicking a citation opens the source viewer directly focused on the relevant passage or video timestamp.
- **Dual-Layer Memory Architecture**:
  - Short-Term: Automated 8-message rolling conversation summarization with a 12-message sliding window.
  - Long-Term: Mem0 integration that extracts user facts, expertise level, and study habits to tailor future explanations across all workspaces.
- **Generative Learning Artifacts**:
  - **Flashcards**: Interactive front/back flip cards with keyboard navigation and study progress tracking.
  - **Quizzes**: Multi-question multiple-choice evaluations with option randomization, instant grading, and contextual explanations.
  - **Mind Maps**: Automatic hierarchical node-and-edge graphs rendered using React Flow (`@xyflow/react`) and arranged via `@dagrejs/dagre`.
  - **Takeaways & Summaries**: High-density bulleted insights and comprehensive long-form markdown overviews.
  - **Reports**: Multi-section structured analytical reports.
- **Workspace Organization**:
  - Complete multi-tenant data isolation per user.
  - Per-workspace default model configuration (`gpt-5.4-mini` or `gpt-5.4-nano`).
  - Search, filter, and bulk deletion capabilities.
- **Production-Ready Security**:
  - Better Auth with email/password and optional GitHub/Google OAuth.
  - Cookie-based JWT session verification enforced at the Next.js middleware boundary (`proxy.ts`).
  - Cloudflare R2 object storage with presigned private access URLs.

---

## Tech Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16.3.1](https://nextjs.org/) (App Router) | Server components, streaming routes, and application layout |
| **UI Library & Motion** | [React 19.2.8](https://react.dev/) | Core UI rendering with React 19 concurrent features |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first stylesheet engine |
| **Component Primitives** | [Radix UI](https://www.radix-ui.com/) & [Hugeicons](https://hugeicons.com/) | Accessible interactive primitives and icon system |
| **Graph / Mindmap Visualization** | [@xyflow/react](https://reactflow.dev/) & [@dagrejs/dagre](https://github.com/dagrejs/dagre) | Interactive node-edge mind maps with automatic directed graph layout |
| **State & Data Fetching** | [@tanstack/react-query 5](https://tanstack.com/query) | Client-side caching, polling, and optimistic updates |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Drizzle ORM 0.45.2](https://orm.drizzle.team/) | Relational storage, migrations, and type-safe relational schemas |
| **Vector Database** | [Pinecone 8.2.0](https://www.pinecone.io/) | High-dimensional similarity search with metadata filtering |
| **Object Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via `@aws-sdk/client-s3` | S3-compatible private storage for uploaded raw documents |
| **Background Workflows** | [Inngest 4.18.1](https://www.inngest.com/) | Durable execution, retries, and step-function orchestration |
| **AI Framework** | [Vercel AI SDK 7](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/openai`) | Streaming LLM completions, structured object generation, tool calling |
| **AI Models** | OpenAI (`gpt-5.4-mini`, `gpt-5.4-nano`, `text-embedding-3-small`) | Generation, hypothetical document synthesis, and 512-dim embeddings |
| **Long-Term Memory** | [Mem0 3.1.6](https://mem0.ai/) (`mem0ai`) | Cross-session user memory extraction and semantic memory search |
| **Web Scraping** | [Firecrawl 4.32.2](https://www.firecrawl.dev/) | Webpage-to-Markdown conversion and live web search tools |
| **File Parsing** | `unpdf`, `mammoth`, `jszip`, `exceljs`, `youtube-transcript` | Format-specific document and media transcript extraction |
| **Authentication** | [Better Auth 1.6.29](https://www.better-auth.com/) | User accounts, password hashing, OAuth providers, JWT cookie sessions |
| **Rate Limiting** | [@upstash/ratelimit](https://upstash.com/) & [@upstash/redis](https://upstash.com/) | Sliding-window API rate limiting with local in-memory fallback |
| **Runtime & Package Manager** | [Bun](https://bun.sh/) / [Node.js 20+](https://nodejs.org/) | Script execution, package resolution, and runtime environment |

---

## Project Structure

```text
flux/
├── app/                                # Next.js App Router root
│   ├── (main)/                         # Authenticated application shell
│   │   ├── dashboard/                  # Workspaces list & user dashboard
│   │   └── workspace/[workspaceId]/    # Interactive workspace (chat, sources, artifacts)
│   ├── api/                            # REST API Route Handlers
│   │   ├── auth/[...all]/              # Better Auth endpoints
│   │   ├── conversations/              # Conversation & message endpoints
│   │   ├── inngest/                    # Inngest durable webhook serve endpoint
│   │   ├── memories/                   # Mem0 user memory management endpoints
│   │   ├── sources/                    # Multi-format source import & CRUD
│   │   └── workspaces/                 # Workspace management & RAG streaming route
│   ├── icon.png                        # Official project logo asset
│   ├── layout.tsx                      # Root HTML layout & font declarations
│   └── page.tsx                        # Product landing page
├── components/                         # React UI components
│   ├── artifacts/                      # Artifact viewers (Flashcards, Quizzes, Mindmaps)
│   ├── chat/                           # Streaming chat composer, message list, citations
│   ├── memories/                       # Slide-out sheet for inspecting & editing memories
│   ├── shell/                          # Navigation bars, topbars, and application shell
│   ├── sources/                        # Source list, import modal, docx/excel/youtube viewers
│   └── ui/                             # Base UI primitives (buttons, dialogs, inputs)
├── drizzle/                            # Generated SQL migrations & schema meta
├── inngest/                            # Inngest durable functions & event schema
│   ├── client.ts                       # Inngest client initialization
│   ├── events.ts                       # Event name constants
│   └── functions.ts                    # Durable workflows (source, artifact, summary)
├── lib/                                # Core shared utilities & service clients
│   ├── api/                            # Typed client-side API fetcher
│   ├── chunker.ts                      # Recursive paragraph/sentence & page-aware chunker
│   ├── constants.ts                    # Model names, vector dimensions, RAG thresholds
│   ├── env.ts                          # Type-safe Zod environment variable parser
│   ├── file-parser.ts                  # Multimodal file parsing (PDF, DOCX, PPTX, XLSX)
│   ├── firecrawl.ts                    # Firecrawl web scraping & search client
│   ├── mem0.ts                         # Mem0 user memory client & helper methods
│   ├── openai.ts                       # OpenAI client & embedding utilities
│   ├── pinecone.ts                     # Pinecone vector upsert & similarity querying
│   ├── rag.ts                          # Advanced RAG pipeline (HyDE, dual search, RRF)
│   ├── storage.ts                      # Cloudflare R2 / S3 client & presigned URLs
│   └── youtube.ts                      # YouTube transcript fetcher & timestamp parser
├── proxy.ts                            # Next.js route protection & auth proxy middleware
├── scripts/                            # Operational & database maintenance scripts
│   ├── db_clear.ts                     # Truncates PostgreSQL tables & wipes Pinecone index
│   └── reindex.ts                      # Re-chunks and re-embeds all sources to Pinecone
├── server/                             # Server-side business logic & architecture
│   ├── auth.ts                         # Better Auth server configuration
│   ├── db/                             # Drizzle database client & table schemas
│   │   └── schema/                     # Tables: auth, workspace, source, conversation, artifacts
│   ├── modules/                        # Clean architecture domain modules
│   │   ├── chat/                       # Chat controller & streaming handlers
│   │   ├── conversation/               # Conversation service, repository, tools, prompts
│   │   ├── learning-artifact/          # Artifact generation schemas & service
│   │   ├── memory/                     # Mem0 controller & service
│   │   ├── source/                     # Ingestion controllers, services, repositories
│   │   └── workspace/                  # Workspace management domain
│   └── utils/                          # ApiError, response envelopes, rate limiter
├── .dockerignore                       # Docker build context exclusions
├── .env.example                        # Environment variables template
├── docker-compose.yml                  # Multi-service stack (App, PostgreSQL, Inngest)
├── Dockerfile                          # Multi-stage production container definition
├── drizzle.config.ts                   # Drizzle Kit CLI configuration
└── package.json                        # Project dependencies & scripts
```

---

## Getting Started

### Quickstart with Docker Compose

The fastest way to launch the complete system (Flux Next.js application, PostgreSQL 16 database, and Inngest background workflow server) is with Docker Compose:

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```
   *Populate your `OPENAI_API_KEY` and `PINECONE_API_KEY` in `.env`.*

2. **Build and start all containers**:
   ```bash
   docker compose up --build
   ```

3. **Initialize the database schema**:
   ```bash
   bun db:push
   # or with npm/npx:
   npx drizzle-kit push
   ```

The services will be reachable at:
- **Flux Web Interface**: [http://localhost:3000](http://localhost:3000)
- **Inngest Workflow Dashboard**: [http://localhost:8288](http://localhost:8288)
- **PostgreSQL Database**: `localhost:5432`

---

### Manual / Local Setup

If you prefer to run the application directly on your host machine:

#### Prerequisites

- **Runtime**: [Bun](https://bun.sh/) (recommended) or [Node.js 20+](https://nodejs.org/)
- **Database**: PostgreSQL 14+ database instance (e.g. Neon, Supabase, or local PostgreSQL)
- **Vector Database**: [Pinecone](https://www.pinecone.io/) index created with **512 dimensions** and **cosine** metric
- **AI Services**: [OpenAI API Key](https://platform.openai.com/)
- **Optional Services**:
  - [Cloudflare R2](https://developers.cloudflare.com/r2/) for raw file storage
  - [Inngest CLI](https://www.inngest.com/docs/cli) for local durable workflow execution
  - [Mem0](https://mem0.ai/) for long-term user memory
  - [Firecrawl](https://www.firecrawl.dev/) for website scraping & live web search
  - [Upstash Redis](https://upstash.com/) for distributed sliding-window rate limiting

#### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd flux
bun install
```

*(Alternatively, use `npm install` or `pnpm install`)*

### 2. Configure Environment Variables

Create a `.env` file in the root directory and populate the required variables:

```bash
# Core & Runtime
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/flux?sslmode=disable"

# Better Auth (Required)
BETTER_AUTH_SECRET="your-32-char-random-secret-string-here"
BETTER_AUTH_URL="http://localhost:3000"

# OpenAI & AI SDK (Required)
OPENAI_API_KEY="sk-proj-..."

# Pinecone Vector DB (Required for RAG)
PINECONE_API_KEY="pcsk_..."
PINECONE_INDEX="flux"

# Cloudflare R2 Storage (Required for file uploads)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="flux"
R2_ENDPOINT="https://<your-account-id>.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-<id>.r2.dev"

# Inngest Background Workflows (Optional for local dev, uses local dev server)
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""

# Upstash Redis (Optional; falls back to in-memory limiter if omitted)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# External Integrations (Optional)
MEM0_API_KEY=""
FIRECRAWL_API_KEY=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. Initialize Database Schema

Push the Drizzle schema directly to your PostgreSQL database:

```bash
bun db:push
```

To open Drizzle Studio for visual database browsing:

```bash
bun db:studio
```

### 4. Run the Development Server

Start the Next.js development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Run Inngest Dev Server (For Background Jobs)

In a separate terminal, launch the Inngest local development server to process asynchronous workflows (source ingestion, artifact generation, and rolling summarization):

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

The Inngest dashboard will be available at [http://localhost:8288](http://localhost:8288).

---

## How It Works

### Ingestion Flow

```text
User uploads file / enters URL / enters YouTube link
    ↓
POST /api/sources/import/*
    ↓
Format Extractor (unpdf / mammoth / jszip / exceljs / youtube-transcript / firecrawl)
    ↓
Raw file uploaded to Cloudflare R2 bucket (presigned access)
    ↓
Source record created in PostgreSQL with status: PENDING
    ↓
Inngest Event Dispatched: 'source/created'
    ↓
Step 1: Mark source as PROCESSING
Step 2: Recursive chunking (chunkPages for PDFs; chunkText for documents)
Step 3: Source chunks stored in PostgreSQL 'source_chunk'
Step 4: Batched embeddings generated via OpenAI text-embedding-3-small (50 chunks/batch)
Step 5: Vectors and metadata upserted into Pinecone (100 vectors/batch)
Step 6: Mark source as READY in PostgreSQL
```

### RAG Chat & Retrieval Flow

```text
User sends query in Workspace Chat
    ↓
POST /api/workspaces/[id]/chat
    ↓
Verify user session & apply sliding-window rate limit (Upstash / Memory)
    ↓
Parallel Context Gathering:
    ├── 1. Advanced RAG Retrieval:
    │      ├── Query Enhancement + HyDE Passage generation (single LLM pass)
    │      ├── Parallel OpenAI Embeddings (enhanced query + hypothetical passage)
    │      ├── Parallel Pinecone Vector Queries (workspace metadata filter)
    │      ├── Reciprocal Rank Fusion (RRF k=60) merges ranked candidate lists
    │      └── Adjacent-chunk proximity deduplication (top 8 chunks selected)
    │
    ├── 2. Mem0 Semantic Memory Search (retrieves user profile & preferences)
    │
    └── 3. PostgreSQL Conversation Rolling Summary (from previous turns)
    ↓
System Prompt Assembly (Citations context + Rolling summary + User memories)
    ↓
Vercel AI SDK streamText (gpt-5.4-mini / gpt-5.4-nano)
    ├── Optional tool execution: Firecrawl web_search tool (if web toggle active)
    └── Streaming text tokens piped directly to client ReadableStream
    ↓
Assistant reply persisted to PostgreSQL with exact chunk citations
    ↓
Message counter check: every 8 messages, dispatches 'conversation/summarize' to Inngest
```

---

## Operational Scripts

The repository includes administrative scripts for managing and re-indexing the vector database:

### Vector Re-Indexing

If you update vector dimensions, switch embedding models, or need to restore a Pinecone index from PostgreSQL:

```bash
bun db:reindex
```

This script reads all records from `source_chunk`, generates fresh embeddings via OpenAI `text-embedding-3-small` in batches of 50, and upserts them to Pinecone with chunk metadata.

### Database Purge

To completely truncate all workspace, source, conversation, and artifact tables in PostgreSQL and wipe the associated Pinecone index:

```bash
bun db:clear
```

---

## Testing & Quality

Code quality and formatting are maintained via ESLint and Prettier:

- **Linting**:
  ```bash
  bun run lint
  ```
- **Code Formatting**:
  ```bash
  bun run format
  ```
- **Type Checking**:
  ```bash
  bun x tsc --noEmit
  ```

*(Note: Automated unit/integration test suites are not currently configured in this repository; verification is performed through TypeScript strict mode, ESLint, and Inngest local step tracing).*

---

## Deployment

Flux is configured for deployment on the [Vercel Platform](https://vercel.com):

1. Link the repository to your Vercel project (a `.vercel/project.json` mapping is included).
2. Configure all environment variables in your Vercel Project Settings.
3. For background processing in production, connect your deployed `/api/inngest` endpoint to your [Inngest Cloud](https://www.inngest.com/) dashboard.
4. Run standard build:
   ```bash
   bun run build
   ```

---

## License

This software is private and proprietary. All rights reserved. Refer to `package.json` (`"private": true`).
