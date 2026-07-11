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

The public home page works as the demo surface. A Google-only authenticated dashboard reuses the same research workspace for protected access.

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
  - route pages for `/`, `/dashboard`, auth pages, and API handlers
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
  - reusable research workspace UI
- `db/`
  - Drizzle client and schema definitions
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

Suggested demo companies:

- `Microsoft`
- `NVIDIA`
- `Costco`
- `Tesla`
- `PayPal`

Good interview demo pattern:

1. Run a high-quality compounder such as `Microsoft` or `Costco`.
2. Run a fast-growth name such as `NVIDIA`.
3. Run a more debated name such as `Tesla` or `PayPal`.
4. Compare how the agent changes the risk profile and final verdict.

Because the app uses live financial/news data, exact output will vary by date, available headlines, and whether the Gemini path or heuristic fallback is active.

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
