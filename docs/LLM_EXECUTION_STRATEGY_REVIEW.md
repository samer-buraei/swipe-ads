# LLM Execution Strategy Review

Last updated: 2026-03-11

## Purpose

This document proposes how SwipeMarket fixes should be executed using multiple LLMs with different capability levels.

It is written for human review before any large batch of prompts is handed to weaker coding agents.

The goal is to answer:
- what the orchestration strategy is
- why that strategy is chosen
- which roles should exist
- which files are canonical
- how prompt files should be structured and used
- what another reviewer should challenge before adoption

---

## Executive Summary

The recommended system is:

1. A strong model keeps project truth and decides sequencing.
2. A strong model converts backlog items into very small, single-path prompt packets.
3. Less capable models implement only small local changes.
4. A strong model reviews each patch for correctness and regression risk.
5. A strong model stitches related patches together at the end of each workstream.

This is recommended because weaker models usually fail from ambiguity, hidden dependencies, and context loss, not from inability to write basic code.

So the system should optimize for:
- small prompt size
- low ambiguity
- low file overlap
- explicit constraints
- frequent review
- continuous stitching

---

## Operational Prerequisites Before Packet 1

Before any builder packet is issued, the system should establish these practical controls:

1. A baseline runtime snapshot
2. A git/branching policy
3. A packet classification rule for schema-sensitive work
4. A deterministic QA dataset
5. Builder-model calibration
6. A shared error-handling rule
7. A verification rule for local vs preview deploy checks
8. A hot-file locking rule

These are not optional process polish.
They are the difference between a good plan on paper and a system that runs smoothly in the first real execution session.

---

## Baseline Snapshot Requirement

Before Workstream 1 starts, one strong-model or human pass should record what works in the running app right now.

Why this is needed:
- if a packet appears to break something, the team must know whether that thing was already broken
- code inspection alone is not enough
- `STATUS.md` is source-verified, but not a dated runtime baseline

Recommended baseline contents:
- commit hash
- date
- environment used
- whether local or Vercel preview/live was checked
- whether seed data was loaded
- which routes load successfully
- which key actions currently work
- which known issues are already present

Recommended file:
- `docs/BASELINE_RUNTIME_STATE_YYYY-MM-DD.md`

Minimum expectation before execution:
- one recorded baseline exists and is linked from the active queue or orchestration notes

---

## Core Logic Behind The Strategy

### Why not give weaker models large feature prompts

Large prompts look efficient, but they create failure modes:
- the model makes product decisions it was not supposed to make
- it edits too many files and loses consistency
- it misses hidden dependencies
- it forgets project-specific constraints
- it self-certifies incomplete work

For this codebase, that risk is especially high because many features are already partially implemented.
That means the model must distinguish between:
- route exists but loop is incomplete
- backend exists but UI is thin
- UI exists but is fake or dead

That is global reasoning.
Global reasoning should stay with stronger models.

### What weaker models are actually good at

Less capable models perform much better when asked to do only one of these:
- wire a dead button
- display an existing field
- create one shared hook
- replace repeated logic in one or two pages
- add one simple mutation and call it from one component
- remove fake UI

These are local edits.
Local edits are what weaker models should do.

### Why continuous stitching is necessary

If many small agents work independently, drift appears quickly:
- prompt phrasing drifts
- naming drifts
- patterns drift
- two packets solve the same problem differently
- hot files become merge traps

So stitching should not happen only at the end.
It should happen after each workstream or lane.

---

## Recommended Role Hierarchy

## 1. State Keeper

Recommended model level: strong

Purpose:
- keep the project truth
- know what is done, blocked, stale, or disproven
- keep canonical docs aligned

Reads:
- `AGENTS.md`
- `STATUS.md`
- `REVAMP_TODO.md`
- `FULL_FEATURE_TEST_PLAN_RESULTS.md`

Produces:
- current state summary
- next-task queue
- doc updates when status changes

This role prevents document drift.

## 2. Task Shaper

Recommended model level: strong

Purpose:
- convert backlog items into small, executable prompt packets
- choose the exact implementation direction before a weak model sees the task
- remove ambiguity, branching, and unnecessary context

Produces:
- packet prompt files
- checkpoint prompts
- reviewer prompts

This is the most important role.
Weak models should not be asked to decide among multiple approaches.

## 3. Builder

Recommended model level: weak to mid

Purpose:
- implement one atomic packet
- touch very few files
- stop and report blockers instead of improvising

Expected scope:
- usually 1-2 files
- sometimes 3 files if one is a contracts or router file

This role should not be defined abstractly forever.
Before real execution begins, the team should choose the actual builder model and calibrate packet size against that model.

## 4. Reviewer

Recommended model level: strong

Purpose:
- compare patch vs packet
- check local correctness
- identify regressions and incomplete wiring

The reviewer should not rewrite the feature.
The reviewer should judge whether the packet was executed correctly and safely.

## 5. Verifier

Recommended model level: mid to strong

Purpose:
- perform the small checkpoint for the lane that just changed
- validate the exact acceptance criteria
- report whether the patch is actually usable

This can be the same model tier as reviewer, but it should be a separate role in the process.

## 6. Integrator

Recommended model level: strong

Purpose:
- merge overlapping patches
- normalize patterns across a workstream
- handle hot files and multi-patch conflicts
- update backlog state after a lane lands

This is the stitching role.

---

## Work Hierarchy

The hierarchy should be:

1. `Program`
2. `Workstream`
3. `Lane`
4. `Packet`
5. `Checkpoint`

### Program

The full revamp effort.

Source:
- `REVAMP_TODO.md`

### Workstream

A major product area, for example:
- navigation and auth
- swipe
- listing detail
- messaging
- seller inventory
- trust/admin

### Lane

A file-overlap-aware slice of work.

Examples:
- `nav-auth lane`
- `swipe lane`
- `listing-detail lane`
- `messaging lane`
- `profile-seller lane`
- `admin lane`

Lanes matter because prompts touching the same hot file should not be parallelized.

### Packet

The actual atomic task given to a weaker model.

A good packet has:
- one user problem
- one exact implementation path
- one touch budget
- one acceptance test
- one reply format

Each packet should also be classified before assignment:
- `CODE_ONLY`
- `SCHEMA_FIRST`
- `ENV_OR_HUMAN_REQUIRED`

### Checkpoint

A small verification step after a few related packets land.

Checkpoints should be lane-based, not giant end-to-end tests after every small change.

They should also assume deterministic data, not accidental existing listings or users.

---

## Canonical File Hierarchy

These should be the source-of-truth order for orchestration.

### Level 1: Project Truth

- `REVAMP_TODO.md`
  Use for: what should be built next and in what priority order

- `STATUS.md`
  Use for: what the code actually does now, route map, API map, button/code trace, known gaps

- `AGENTS.md`
  Use for: operational state, deployment history, environment caveats, what previously worked or failed

- `CLAUDE.md`
  Use for: codebase map and implementation guardrails

### Level 2: Prompt System

Proposed new hierarchy:

```text
prompts/
  README.md
  templates/
    builder-packet.md
    reviewer-packet.md
    verifier-checkpoint.md
  queue/
    active.md
  packets/
    W01-P01-mobile-favorites.md
    W01-P02-remove-fake-unread-badge.md
    W01-P03-create-useRequireAuth.md
    ...
  checkpoints/
    C01-nav-swipe.md
    C02-listing-search-messaging.md
    ...
  reviews/
    W01-P01-mobile-favorites-review.md
    ...
```

### Level 3: Output Tracking

Proposed optional hierarchy:

```text
orchestration/
  lane-status.md
  merge-notes.md
  blockers.md
```

This is optional, but useful if many agents are running.

### Level 4: Runtime And Orchestration State

Recommended additional files:

```text
docs/
  BASELINE_RUNTIME_STATE_YYYY-MM-DD.md
  QA_DATASET_REQUIREMENTS.md

orchestration/
  lane-status.md
  merge-notes.md
  blockers.md
  hot-file-locks.md
```

---

## How The Prompt Files Should Be Used

## `prompts/README.md`

Purpose:
- explains the orchestration rules in one screen
- tells agents not to read the whole project unless told to
- defines packet naming, touch budgets, and review flow

## `prompts/templates/builder-packet.md`

Purpose:
- reusable prompt format for weak builders

Should include:
- Role
- Task
- Context
- Read first
- Change
- Do not touch
- Touch budget
- If blocked
- Done when
- Reply format

## `prompts/templates/reviewer-packet.md`

Purpose:
- reusable review format for strong reviewers

Should include:
- packet id
- intended behavior
- changed files
- review questions
- required output format

## `prompts/queue/active.md`

Purpose:
- single place showing which packet is next
- which lane is active
- which files are considered hot
- which packets are blocked

This keeps the system from launching overlapping work by accident.
It should also reference:
- the active baseline snapshot
- the active branch name
- any locked files
- whether the current packet is `CODE_ONLY`, `SCHEMA_FIRST`, or `ENV_OR_HUMAN_REQUIRED`

## `prompts/packets/*.md`

Purpose:
- one packet per file
- one builder sees one packet

Design rules:
- small enough for weak models
- no product choices
- no multiple implementation options
- no long narrative

## `prompts/checkpoints/*.md`

Purpose:
- lane verification only
- small enough for a verifier model

Example:
- nav/auth checkpoint
- messaging checkpoint
- listing-detail checkpoint

## `prompts/reviews/*.md`

Purpose:
- capture review findings per packet
- create traceability before merge

These do not need to be large.
Short review logs are enough.

---

## Recommended Packet Rules

Every builder packet should follow these rules:

1. Maximum scope: one concern.
2. Maximum touch budget: 2 files by default.
3. If 3 files are needed, the packet must say so explicitly.
4. No implementation branching.
5. No “Option A / Option B”.
6. No line-number dependence unless the file is frozen.
7. Prefer function/component names and labels over line numbers.
8. If schema changes are needed, split schema from UI wiring.
9. If API contracts change, explicitly tell the builder whether to update `contracts/validators.ts` and `contracts/api.ts`.
10. Every packet ends with a fixed reply format.
11. Each packet must declare whether Vercel preview verification is acceptable, or whether local/shared-environment verification is required.
12. Each packet must specify the error-handling pattern to follow.

Packet classification rules:

- `CODE_ONLY`
  Means the builder can complete the work entirely in code.

- `SCHEMA_FIRST`
  Means a schema or SQL change is required before a weak builder should do the wiring.
  These packets must be split into:
  1. schema/migration step by a human or strong model
  2. code wiring packet for the builder

- `ENV_OR_HUMAN_REQUIRED`
  Means the work depends on environment access, external dashboard access, or a human-controlled step.
  Weak builders should not be assigned these packets directly.

Error-handling rule to place in every builder packet:
- In server mutations, use `TRPCError` for user-facing failures.
- In UI, show inline error text or local error state.
- Do not introduce new `alert()` usage.
- Use `console.error` only for non-blocking or diagnostic logging.

Recommended reply format:

```text
Changed files:
Tests run:
Blockers:
Notes:
```

---

## Safe Parallelism Rules

Do not parallelize packets that touch the same hot file.

High-risk hot files in this project:
- `components/listings/SwipeDeck.tsx`
- `app/listing/[slug]/page.tsx`
- `components/messages/ConversationView.tsx`
- `app/profile/page.tsx`
- `app/profile/[userId]/page.tsx`
- `app/admin/page.tsx`
- `server/api/routers/admin.ts`

Safer lanes for serialization:
- nav/auth
- swipe
- listing detail
- search
- messaging
- profile/seller
- saved search
- trust/admin
- shared logic
- legal/footer

Within one lane:
- builders may do one packet at a time
- reviewer checks each packet
- integrator stitches after 3-5 packets or lane completion

## Hot-File Locking Rule

In addition to lane sequencing, the system should keep a simple lock file for active ownership of hot files.

Recommended file:
- `orchestration/hot-file-locks.md`

Each lock entry should include:
- file path
- owning packet id
- owning branch
- lock start time
- expected release condition

Rule:
- if a file is locked by an active packet, no new builder packet may touch it until the reviewer or integrator releases the lock

This is especially important for:
- `app/listing/[slug]/page.tsx`
- `components/listings/SwipeDeck.tsx`
- `components/messages/ConversationView.tsx`
- `app/profile/page.tsx`

---

## Git And Branching Policy

The recommended git strategy is:

- one branch per active workstream or lane
- one commit per accepted packet
- one PR per workstream checkpoint or lane checkpoint

Recommended branch examples:
- `ws01-nav-auth`
- `ws02-swipe`
- `ws03-listing-detail`

Recommended commit style:
- `W01-P01 add mobile favorites access`
- `W01-P02 remove fake unread badge`

Rejection and recovery policy:
- if a packet fails review before merge, fix forward on the same branch
- if a bad packet was already merged into the workstream branch, revert that packet commit back to the last known good state
- do not keep stacking packets on top of an unresolved broken commit

Branch-per-packet is not recommended because it creates too much orchestration noise.

---

## QA Dataset Requirement

Checkpoints should not depend on accidental live data.

Before relevant lanes begin, the team should ensure a small deterministic QA dataset exists.

Examples of required fixtures:
- at least one vehicle listing
- at least one real-estate listing
- at least one listing with multiple images
- at least two users who can message each other
- at least one seller with a visible rating
- at least one saved search profile for notification checks

Recommended file:
- `docs/QA_DATASET_REQUIREMENTS.md`

Recommended process:
- Step 0 in the first checkpoint should confirm that the dataset exists
- if missing, run the agreed seed script or SQL before verification starts

---

## Builder Model Calibration

Before piloting Workstream 1, the team should calibrate packet size against the actual builder model that will be used.

Why this matters:
- “weak to mid” is too vague to operationalize
- a local 8B model and a hosted smaller frontier model will not tolerate the same packet size or ambiguity level

Calibration should record:
- model name
- approximate context limit
- safe file-touch budget
- safe packet size
- common failure pattern

Recommended process:
1. choose the intended builder model
2. run 2-3 sample packets on low-risk work
3. measure whether the model stays within scope
4. then finalize packet size and wording style

Do not write the full packet library before this calibration.

---

## Verification Environment Rule

Verification can use:
- local dev environment
- Vercel preview deploys
- the live deployment, if the change is safe to inspect there

Vercel previews are especially useful for:
- route checks
- UI layout checks
- visual review by a human reviewer

But preview-only verification is not enough for every packet.
Some packets still require:
- seeded local/shared data
- database inspection
- schema confirmation
- environment-specific behavior checks

So each checkpoint should declare:
- preview acceptable
- local/shared environment required
- or both

---

## Recommended Operating Flow

1. State Keeper confirms current truth from canonical docs.
2. State Keeper confirms baseline snapshot, QA dataset, active branch, and hot-file locks.
3. Task Shaper chooses one packet from the active lane and classifies it.
4. If the packet is `SCHEMA_FIRST` or `ENV_OR_HUMAN_REQUIRED`, resolve that prerequisite before using a weak builder.
5. Builder gets only that packet plus the listed files.
6. Reviewer checks the patch against the packet.
7. Verifier checks the lane acceptance criteria using the declared verification environment.
8. Integrator merges accepted packets and normalizes the lane.
9. State Keeper updates `REVAMP_TODO.md`, lock state, and any affected status docs.
10. Move to the next packet.

This should repeat continuously.

---

## What Should Be Challenged By A Human Reviewer

Before adopting this system, another reviewer should specifically challenge:

1. Is the role split too heavy for the team size?
2. Is one packet per file too granular, or is it the right size for the models being used?
3. Should verifier and reviewer be separate roles, or combined?
4. Which tasks are too risky for weaker models no matter how small the packet is?
5. Is the proposed prompt-file hierarchy too large, or acceptable for traceability?
6. Should packet history live in the repo, or outside the repo?
7. Are the canonical docs now clear enough that a Task Shaper can safely distill from them?
8. Should hot-file lanes be even narrower than proposed?
9. Is the baseline snapshot process lightweight enough to be maintained honestly?
10. Is the proposed branch-per-lane strategy the right balance between control and noise?
11. Which upcoming tasks are definitely `SCHEMA_FIRST` and should never be given to weaker builders?
12. Is the QA dataset definition strict enough for repeatable checkpoints?
13. Is the intended builder model actually suitable after calibration?

These are the right points to critique before execution starts.

---

## Recommendation

Do not start by writing all 30+ prompts at once.

Instead:
1. Approve the orchestration model.
2. Create the baseline snapshot and QA dataset policy.
3. Choose and calibrate the builder model.
4. Create the prompt templates.
5. Pilot one lane only:
   - navigation/auth
   - or swipe
6. Review whether the packet size is correct.
7. Then expand to the rest of the workstreams.

This reduces process waste and lets the team calibrate to the actual behavior of the weaker models.

---

## One-Sentence Summary

The optimal way to use weaker coding LLMs on SwipeMarket is to keep all global reasoning, sequencing, and stitching with strong models, and give weaker models only tiny, explicit, low-ambiguity prompt packets tied to a tightly controlled file and review hierarchy.
