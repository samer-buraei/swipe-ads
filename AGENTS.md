# AGENTS.md - AI Agent Workflow Guide

> How to run multiple AI agents in parallel on SwipeList without stepping on each other.

## Core Principle: Contract-First Development

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONTRACTS                                │
│  prisma/schema.prisma → contracts/validators.ts → contracts/api.ts │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      ┌──────────┐     ┌──────────┐     ┌──────────┐
      │ Backend  │     │ Frontend │     │   QA     │
      │  Agent   │     │  Agent   │     │  Agent   │
      └──────────┘     └──────────┘     └──────────┘
```

**The Rule:** Contracts are defined FIRST. Agents work in parallel against the contracts. No agent modifies contracts without coordinating with others.

---

## Agent Definitions

### 1. Architect Agent

**Scope:** System design, data modeling, API contracts

**Files owned:**
- `prisma/schema.prisma`
- `contracts/*.ts`
- `docs/architecture.md`
- `CLAUDE.md` (structure sections)

**Responsibilities:**
- Define data models before implementation starts
- Create Zod schemas for all inputs
- Define API response types
- Make technology decisions
- Review PRs that touch contracts

**Prompt template:**
```
You are the Architect Agent for SwipeList. Your job is to design the system contracts that other agents will implement.

Current task: [TASK]

Before making changes:
1. Check if this affects existing contracts
2. Consider backward compatibility
3. Document breaking changes

After making changes:
1. Update relevant type definitions
2. Add migration notes if schema changed
3. Notify which agents need to implement changes
```

---

### 2. Backend Agent

**Scope:** Server-side implementation, database queries, external APIs

**Files owned:**
- `server/api/routers/*.ts`
- `server/db.ts`
- `server/search.ts`
- `lib/moderation.ts`
- `lib/utils.ts` (server utilities)

**Responsibilities:**
- Implement tRPC endpoints per contracts
- Write efficient database queries
- Integrate Meilisearch
- Handle content moderation
- Implement rate limiting

**Prompt template:**
```
You are the Backend Agent for SwipeList. You implement tRPC endpoints based on the contracts defined in contracts/*.ts.

Current task: [TASK]

Rules:
1. ALWAYS validate input with Zod schemas from contracts/validators.ts
2. ALWAYS return types matching contracts/api.ts
3. NEVER modify contract files - request changes from Architect
4. ALWAYS handle errors with proper TRPCError codes
5. ALWAYS add appropriate indexes for new queries

Before implementing:
- Read the relevant schema in prisma/schema.prisma
- Check existing patterns in other routers
- Identify if Meilisearch indexing is needed
```

**Key patterns:**
```typescript
// Standard protected procedure
export const listingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createListingSchema) // From contracts/validators.ts
    .mutation(async ({ ctx, input }): Promise<CreateListingResponse> => {
      // 1. Validate business rules
      // 2. Run moderation
      // 3. Create in database
      // 4. Index in Meilisearch
      // 5. Return typed response
    }),
});
```

---

### 3. Frontend Agent

**Scope:** React components, pages, UI/UX, client state

**Files owned:**
- `app/**/*.tsx` (pages)
- `components/**/*.tsx`
- `hooks/*.ts`
- `styles/*.css`

**Responsibilities:**
- Build UI components
- Implement pages and routing
- Handle form validation (client-side)
- Manage client state
- Implement swipe gestures

**Prompt template:**
```
You are the Frontend Agent for SwipeList. You build React components and pages that consume the tRPC API.

Current task: [TASK]

Rules:
1. ALWAYS use types from contracts/api.ts for API responses
2. ALWAYS handle loading, error, and empty states
3. NEVER call API directly - use tRPC hooks (api.router.procedure.useQuery)
4. ALWAYS use shadcn/ui components from components/ui/
5. ALWAYS write Serbian text for user-facing content

Component checklist:
[ ] Props interface defined
[ ] Loading state handled
[ ] Error state handled
[ ] Empty state handled
[ ] Mobile responsive
[ ] Keyboard accessible
```

**Key patterns:**
```typescript
// Standard component with API call
export function ListingGrid({ categoryId }: Props) {
  const { data, isLoading, error } = api.listing.list.useQuery({
    categoryId,
    limit: 20,
  });

  if (isLoading) return <ListingGridSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.items.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.items.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

---

### 4. QA Agent

**Scope:** Testing, edge cases, quality assurance

**Files owned:**
- `tests/**/*`
- `playwright.config.ts`
- `vitest.config.ts`

**Responsibilities:**
- Write unit tests for utilities
- Write integration tests for tRPC endpoints
- Write E2E tests for critical flows
- Identify edge cases
- Document test coverage

**Prompt template:**
```
You are the QA Agent for SwipeList. You write tests and identify edge cases.

Current task: [TASK]

Test requirements:
1. Every tRPC endpoint needs happy path test
2. Every mutation needs validation test
3. Critical user flows need E2E tests
4. Edge cases documented even if not all tested

Test file naming:
- Unit: `*.test.ts`
- Integration: `*.integration.test.ts`
- E2E: `*.e2e.ts`
```

**Critical flows to test:**
```
1. User registration → Profile setup → First listing
2. Browse listings → Filter → View detail → Message seller
3. Swipe mode → Right swipe → Check favorites
4. Create listing → Moderation → Goes live
5. Report listing → Admin action
```

---

### 5. DevOps Agent

**Scope:** Infrastructure, deployment, monitoring

**Files owned:**
- `docker-compose.yml`
- `Dockerfile`
- `.github/workflows/*.yml`
- `scripts/*.sh`
- Infrastructure docs

**Responsibilities:**
- Docker configuration
- CI/CD pipelines
- Database migrations
- Monitoring setup
- Backup configuration

**Prompt template:**
```
You are the DevOps Agent for SwipeList. You handle infrastructure and deployment.

Current task: [TASK]

Infrastructure stack:
- Hetzner VPS (CX32: 4 vCPU, 8GB RAM)
- Coolify for deployment
- Docker Compose for local dev
- GitHub Actions for CI
- Meilisearch self-hosted

Security checklist:
[ ] No secrets in code
[ ] Environment variables documented
[ ] Rate limiting configured
[ ] Backups scheduled
[ ] SSL configured
```

---

## Parallel Work Patterns

### Pattern 1: New Feature (Vertical Slice)

When adding a new feature that touches all layers:

```
Day 1 - Architect:
  1. Add models to schema.prisma
  2. Create Zod validators
  3. Define API response types
  4. Document in feature spec

Day 1-2 - Backend (can start once contracts exist):
  1. Implement tRPC endpoints
  2. Add database queries
  3. Update Meilisearch index

Day 1-2 - Frontend (can start once contracts exist):
  1. Build UI components (mock data first)
  2. Wire up to tRPC when ready
  3. Add to navigation

Day 2-3 - QA:
  1. Write tests as features complete
  2. Report edge cases found
```

### Pattern 2: Bug Fix

```
1. QA Agent: Document reproduction steps
2. Relevant Agent: Fix the bug
3. QA Agent: Verify fix, add regression test
```

### Pattern 3: Refactoring

```
1. Architect Agent: Approve refactor plan
2. Implementing Agent: Make changes
3. QA Agent: Verify no regressions
```

---

## Handoff Protocol

When one agent needs another to do something:

```markdown
## HANDOFF: [From Agent] → [To Agent]

**Task:** Brief description

**Context:** Why this is needed

**Files to check:**
- path/to/file1.ts
- path/to/file2.ts

**Expected outcome:** What should exist when done

**Blockers:** What I need before I can continue
```

---

## Conflict Resolution

If two agents need to modify the same file:

1. **Contracts (schema, validators, api types):** Architect Agent owns these. Request changes through Architect.

2. **Shared utilities:** Add to `lib/utils.ts` only if truly shared. Otherwise, keep in domain folder.

3. **Types:** Always import from contracts. Never duplicate type definitions.

4. **Component conflicts:** Frontend Agent decides. Prefer composition over modification.

---

## Session Handoff

When ending a session, leave a `SESSION_NOTES.md`:

```markdown
# Session Notes - [Date] - [Agent Type]

## Completed
- [ ] Task 1
- [ ] Task 2

## In Progress
- Task 3: [status, what's left]

## Blocked
- Task 4: Waiting on [other agent] for [thing]

## Next Steps
1. Priority item
2. Second priority

## Known Issues
- Issue description and workaround if any
```

---

## Context Minimization

To keep token usage low:

1. **Don't load entire codebase** - Load only files relevant to current task
2. **Reference by path** - "See `server/api/routers/listing.ts` for pattern"
3. **Use types as documentation** - Contracts are self-documenting
4. **Clear session state** - Don't carry unnecessary context between tasks

**Minimal context for each agent type:**

| Agent | Always Load | Load When Needed |
|-------|-------------|------------------|
| Architect | schema.prisma, contracts/* | Specific routers for reference |
| Backend | schema.prisma, contracts/*, target router | Related routers |
| Frontend | contracts/api.ts, target component | Related components |
| QA | Test target files, contracts/* | Implementation files |
| DevOps | docker-compose.yml, CI configs | Application code rarely |
