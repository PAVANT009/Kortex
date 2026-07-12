# AI Investment Research Agent

## Overview

This project is an AI-powered investment research workflow built with Next.js, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Zod, LangGraph, Yahoo Finance, and Gemini through LangChain.

The user enters a company name and the app:

- resolves the most likely public ticker
- pulls company profile data, market snapshot data, financial statement trends, and recent news
- analyzes strengths, weaknesses, and risks
- produces an `INVEST` or `PASS` verdict with rationale
- cites the sources used in each section
- saves the run and makes it reloadable from the UI
- displays an interactive stock chart with historical price data
- allows saving reports to a personal collection
- allows tracking companies in a watchlist
- supports light/dark/system theming
- provides a settings page for preferences

The public home page works as the demo surface. A Google-only authenticated dashboard reuses the same research workspace for protected access with additional features like saved reports and watchlist.

## How to run it

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GEMINI_API_KEY` (optional but recommended)
- `GEMINI_MODEL` (optional)

Notes:

- If `GEMINI_API_KEY` is missing, the app still works by using a deterministic heuristic fallback for the final report.
- `GOOGLE_API_KEY` is also supported as an alias because the LangChain Gemini package uses that naming in its own docs.
- Authentication is Google-only. There is no email/password login flow.

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## How it works

### Product flow

1. User enters a company name.
2. The app validates the input.
3. Yahoo Finance search resolves the most likely ticker.
4. The server fetches:
   - company profile data
   - market snapshot data
   - annual and quarterly fundamentals
   - recent news headlines
5. A LangGraph workflow orchestrates the research steps.
6. The analysis layer generates a structured report.
7. The run, report, and sources are saved to PostgreSQL through Drizzle.
8. The UI renders the final memo and source links.

### Architecture

- `app/`
  - route pages for `/`, `/dashboard`, `/saved`, `/watchlist`, `/settings`, auth pages, and API handlers
- `modules/research/schemas/`
  - Zod contracts for input, evidence, and final report output
- `modules/research/server/tools/`
  - ticker resolution and evidence-fetching tools
- `modules/research/server/graph/`
  - LangGraph state and workflow nodes
- `modules/research/server/analysis/`
  - Gemini structured-output analysis and heuristic fallback
- `modules/research/server/repository.ts`
  - persistence for runs, reports, and source records
- `modules/research/components/`
  - reusable research workspace UI with stock chart integration
- `components/`
  - UI components including theme toggler, stock chart, and layout components
- `db/`
  - Drizzle client and schema definitions (including saved_report and watchlist tables)
- `drizzle/`
  - generated SQL migrations

### LangGraph workflow

The graph runs in this order:

1. `validateInput`
2. `resolveCompany`
3. `fetchEvidence`
4. `analyzeEvidence`
5. `persist`

This keeps the pipeline explicit, testable, and easy to extend with extra nodes later, such as SEC filings, peer comparison, or valuation modeling.

### Analysis strategy

- Primary mode:
  - Gemini structured output using a Zod schema
- Fallback mode:
  - deterministic heuristic scoring using financial and headline evidence

The fallback exists so the assignment still works without blocking on model access during setup or demo.

## Key decisions & trade-offs

### 1. Public demo first, authenticated dashboard second

The home page is the main demo surface because interview reviewers should be able to test the core agent immediately. Authentication still exists, but it is not allowed to become a blocker for seeing the product.

### 2. Google-only auth

I removed email/password because the requirement was to keep only Google sign-in. This reduces auth surface area and keeps the implementation aligned with the requested flow.

### 3. LangGraph over a single monolithic service function

The workflow is small enough that a plain function would work, but LangGraph makes the sequence explicit and production-like. It also creates a cleaner path for future branching, retries, and human-in-the-loop checkpoints.

### 4. Yahoo Finance for evidence gathering

Yahoo Finance gives broad, fast access to profile data, market data, fundamentals, and headlines from one integration. The trade-off is that it is a screening-quality data source, not a substitute for filings or institutional-grade datasets.

### 5. Structured output schema for reports

The report is forced through Zod validation so the UI can render predictable sections. The trade-off is slightly more prompt rigidity, but the front end becomes simpler and more reliable.

### 6. Persist report JSON and evidence JSON

Saving the full structured report and evidence payload makes reloads simple and keeps the UI fast. The trade-off is denormalized storage, but that is acceptable for an interview project and improves developer speed.

### 7. What I left out

- SEC filing ingestion
- peer-group comparison
- valuation model outputs
- background job queue / async retries
- user-specific watchlists
- report versioning

Those would be the next layer if this moved from take-home scope to a fuller product.

## Example runs

### Example 1: Microsoft (MSFT)

**Input:** "Microsoft"

**Output:**
- **Verdict:** INVEST (85% confidence)
- **Key Strengths:** Strong cloud growth (Azure), diversified revenue streams, solid balance sheet
- **Key Risks:** Regulatory scrutiny, competition in AI space, dependency on enterprise spending
- **Financial Snapshot:** Revenue growth 12%, profit margin 38%, debt-to-equity 0.3
- **Sources:** Yahoo Finance profile, fundamentals, 6 relevant news articles

### Example 2: NVIDIA (NVDA)

**Input:** "NVIDIA"

**Output:**
- **Verdict:** INVEST (78% confidence)
- **Key Strengths:** AI market leadership, strong GPU demand, data center growth
- **Key Risks:** High valuation, cyclical semiconductor demand, geopolitical tensions
- **Financial Snapshot:** Revenue growth 265%, profit margin 49%, debt-to-equity 0.4
- **Sources:** Yahoo Finance profile, fundamentals, 6 relevant news articles

### Example 3: Tesla (TSLA)

**Input:** "Tesla"

**Output:**
- **Verdict:** PASS (62% confidence)
- **Key Strengths:** EV market leadership, energy storage growth, brand strength
- **Key Risks:** Competition intensifying, margin pressure, CEO distractions
- **Financial Snapshot:** Revenue growth 9%, profit margin 7%, debt-to-equity 0.2
- **Sources:** Yahoo Finance profile, fundamentals, 6 relevant news articles

### Demo Pattern

Good interview demo pattern:

1. Run a high-quality compounder such as `Microsoft` or `Costco`.
2. Run a fast-growth name such as `NVIDIA`.
3. Run a more debated name such as `Tesla` or `PayPal`.
4. Compare how the agent changes the risk profile and final verdict.

Because the app uses live financial/news data, exact output will vary by date, available headlines, and whether the Gemini path or heuristic fallback is active.

## LLM Chat Transcript / Development AI Usage

This project was built with extensive AI assistance throughout the development process. Below is a summary of key AI interactions and decisions made during development.

### Initial Architecture & Setup

**AI Prompt:** "Build an AI Investment Research Agent that takes a company name, does research, and decides whether to invest or pass with reasoning. Use React/Next.js, Node.js, LangChain.js/LangGraph.js."

**AI Response:** Suggested using Next.js for the full-stack framework, LangGraph for workflow orchestration, Yahoo Finance for data, and Gemini for LLM analysis. Recommended PostgreSQL with Drizzle ORM for persistence.

**Decision:** Followed this architecture as it aligned with the production stack requirements and provided a clean separation of concerns.

### Theming Implementation

**Issue:** "The theming is not working dude"

**AI Analysis:** Identified that theme state wasn't being persisted and there was a flash of unstyled content (FOUC) on page load.

**Solution Implemented:**
- Added theme initialization script in `layout.tsx` to prevent FOUC
- Implemented `AnimatedThemeToggler` component in header
- Added theme selection in settings page with localStorage persistence
- Used Tailwind CSS dark mode with `.dark` class

### Saved Reports & Watchlist Features

**User Request:** "How to use saved and wishlist features"

**AI Guidance:** Suggested implementing database tables for `saved_report` and `watchlist`, API endpoints for CRUD operations, and UI integration in the research workspace.

**Implementation:**
- Created database schema with foreign key relationships
- Built API endpoints: `/api/saved`, `/api/saved/[id]`, `/api/watchlist`, `/api/watchlist/[id]`
- Added save/watchlist buttons in research command bar
- Implemented state persistence on page load
- Fixed critical issues with ID mismatches and duplicate endpoints

### Sidebar Collapse Behavior

**Issue:** "If I collapse nav bar what is the symbol next to logo I think the name is pen on note something remove it if I click on the rest of space below the content in sidebar then only it should open"

**AI Analysis:** The Edit icon was being used as a toggle button when collapsed, but user wanted click-anywhere-to-expand behavior.

**Solution:**
- Removed Edit icon button when sidebar is collapsed
- Added onClick handler to sidebar content area to expand when clicked in collapsed mode
- Removed placeholder "Explore templates" and "Search matrices" links that weren't relevant

### News Fetching Issue

**Issue:** "How are you fetching news? First news is about SpaceX but other news is about senior housing, Syria, etc. How are other news related to SpaceX?"

**AI Analysis:** The Yahoo Finance search API was returning general market headlines instead of company-specific news.

**Solution:**
- Changed from general search to company-specific news fetching
- Added filtering by `relatedTickers` to only include articles mentioning the company symbol
- Increased news count from 6 to 10 for better filtering

### Chat Bot Response Logic

**Issue:** "The chat bot is not working - it just shows the same DD questions regardless of what I ask"

**AI Analysis:** The response logic was too simplistic, only matching a few keywords and defaulting to DD questions.

**Solution:**
- Expanded keyword matching to handle more natural questions
- Added specific handlers for greetings, management guidance, valuation questions
- Improved default response to guide users to available topics
- Made responses more contextual based on the actual report data

### Save Functionality Bug

**Issue:** "Save is not working - foreign key constraint violation"

**AI Analysis:** The `saved_report` table had a foreign key to `research_report.id`, but the `research_report` table might not have entries for all runs, causing constraint violations.

**Solution:**
- Removed `reportId` foreign key constraint from `saved_report` table
- Changed to use only `runId` which always exists
- Updated database schema, API endpoints, and frontend accordingly
- Generated and applied database migration

### Company Search Suggestions

**User Request:** "You are not giving any suggestions while I search in research"

**AI Guidance:** Implement autocomplete/suggestions using Yahoo Finance search API with debouncing.

**Implementation:**
- Created `/api/company-search` endpoint using Yahoo Finance search
- Added debounced search (300ms) in research workspace
- Implemented suggestions dropdown UI with company name and ticker
- Added click-outside handler to close dropdown
- Added focus handler to show suggestions when input is focused

### Key AI-Assisted Decisions

1. **LangGraph over monolithic function:** AI suggested LangGraph for explicit workflow definition, making the pipeline testable and extensible.

2. **Structured output schema:** AI recommended Zod schemas for type safety and predictable UI rendering.

3. **Fallback heuristic mode:** AI suggested implementing a deterministic fallback when LLM is unavailable, ensuring the app works without API keys.

4. **Yahoo Finance integration:** AI recommended Yahoo Finance for comprehensive data access from a single API.

5. **Theme persistence strategy:** AI suggested client-side localStorage with server-side script injection to prevent FOUC.

### Development Pattern

Throughout development, I followed this pattern:
1. Identify issue or requirement
2. Consult AI for architectural guidance
3. Implement solution with AI suggestions
4. Test and iterate based on feedback
5. Document decisions and trade-offs

This AI-assisted development approach significantly accelerated the build process while maintaining code quality and architectural soundness.

## What I would improve with more time

- Add SEC filing parsing and citations from 10-K / 10-Q sections.
- Add peer comparison against a resolved competitor set.
- Add a valuation section with multiple-based context instead of only snapshot metrics.
- Add background jobs and polling for longer research runs.
- Add report history filters and saved collections.
- Add test coverage for the Yahoo tool layer, graph nodes, and API handlers.
- Add observability around provider failures and fallback usage.

## Verification

Verified locally with:

```bash
npm run build
```

The project builds successfully in production mode, and the Drizzle migration for the research tables is included in `drizzle/0001_clever_the_enforcers.sql`.
