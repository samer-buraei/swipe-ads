# Overnight ClawdBot Workflow

Last updated: 2026-03-11

## Purpose

This is the practical workflow for one human vibecoding their first project while letting ClawdBot and a local LLM do safe heavy lifting overnight.

This workflow is optimized for:
- one human decision-maker
- ClawdBot using your device while you sleep
- a smaller local model doing builder work
- Claude / ChatGPT / Gemini reviewing in the morning

The main rule is simple:

**Do not let the overnight agent make product decisions, schema decisions, or merge decisions.**

Overnight work should be:
- local
- reversible
- packet-based
- on a non-main branch
- reviewed in the morning before push/merge

---

## Your Model Setup

Use the models like this:

### You

Role:
- product owner
- final decision-maker
- decides forks once
- decides what lane is allowed overnight

### ClawdBot + local Qwen 3.5 9B

Role:
- builder only

Use for:
- small code-only packets
- low-risk UI wiring
- local hook creation
- dead-button removal
- simple display/wiring changes

Do not use for:
- schema changes
- admin expansion
- multi-file hot-file refactors
- negotiation system
- message dedup if backend and realtime logic both need reshaping
- package upgrades
- deployment or dashboard changes

### Claude / ChatGPT / Gemini in the morning

Use them for:
- diff review
- regression finding
- checkpoint verification
- stitching related packets
- deciding whether a branch is good enough to push or merge

For the first pilot, keep this simpler:
- use one big model for the full morning review flow
- recommended: Claude Opus
- use ChatGPT or Gemini only for second opinions or uncertainty cases

---

## The Safe Overnight Strategy

The overnight agent should work on only one lane at a time.

Good overnight lanes:
- nav/auth cleanup
- fake affordance cleanup
- small swipe fixes
- profile display fixes
- small seller-loop wiring fixes

Bad overnight lanes:
- messaging reliability if realtime + optimistic behavior are both involved
- listing detail mega-edits
- admin router expansion
- trust/safety changes with schema impact
- anything requiring Supabase SQL editor, Vercel dashboard, or human credentials

For your first project, keep the overnight lane small.

Best first overnight lane:
- `ws01-nav-auth`

---

## The Branch Rule

Never let ClawdBot work directly on `main` while you sleep.

Use:
- one branch per lane
- local commits allowed
- no push overnight unless you explicitly want that
- no merge overnight

Recommended branch names:
- `ws01-nav-auth`
- `ws02-swipe`
- `ws03-listing-detail`

Recommended commit style:
- `W01-P01 add mobile favorites access`
- `W01-P02 remove fake unread badge`

Morning rule:
- review the branch
- then push
- then merge only after review passes

---

## The Packet Rule

ClawdBot should receive only tiny packets.

Each packet should:
- solve one problem
- touch 1-2 files by default
- have no product branching
- have one exact implementation path
- have a clear stop condition

ClawdBot should never be told:
- "choose the best option"
- "redesign this flow"
- "figure out the architecture"
- "fix this whole workstream"

ClawdBot should be told:
- which files to read
- exactly what to change
- what not to touch
- when to stop

---

## Hard Overnight Restrictions

Tell ClawdBot these are forbidden while you sleep:

- no changes to database schema
- no Supabase dashboard actions
- no Vercel dashboard actions
- no package upgrades
- no changes to `.env.local`
- no `git push`
- no `git merge`
- no destructive git commands
- no editing unrelated files to "clean things up"
- no prompts that offer multiple implementation options

Also forbid:
- introducing new `alert()` usage
- replacing patterns across the whole repo unless the packet says so
- touching hot files owned by a different active packet

---

## Files ClawdBot Should Treat As Canonical

Before each night run, the human or big model should point ClawdBot to:

- `C:\Users\sam\Desktop\swipemarket\REVAMP_TODO.md`
- `C:\Users\sam\Desktop\swipemarket\STATUS.md`
- `C:\Users\sam\Desktop\swipemarket\AGENTS.md`

ClawdBot should not be asked to read the whole repo.
It should only read the small list of files named in the packet.

---

## Nightly Setup Checklist

Before you go to sleep:

1. Make sure the repo is on the correct lane branch.
2. Make sure unrelated work is not mixed into that branch.
3. Pick one lane only.
4. Pick at most 3-5 packets for the night.
5. Make sure each packet is `CODE_ONLY`.
6. Make sure no packet requires schema changes or dashboards.
7. Make sure the packet order is fixed.
8. Make sure hot files are not assigned twice.
9. Make sure the branch starts clean enough that morning review is understandable.
10. Create or clear the overnight canary file at `orchestration/_overnight_canary.md`.

Recommended maximum for one night:
- 3 packets for early calibration
- 5 packets after the process is stable

Do not try to burn down a whole workstream overnight.

---

## Morning Review Checklist

When you wake up:

1. Check `git status`
2. Check `git log --oneline --decorate -n 10`
3. Review each overnight commit in order
4. Feed each packet + diff to Claude or ChatGPT for review
5. Ask Gemini or ChatGPT to verify the checkpoint if browser review is needed
6. Keep, edit, or revert packet commits one by one
7. Update `REVAMP_TODO.md` only after the packet is accepted
8. Push only after the branch passes review

The morning is for:
- review
- cleanup
- stitching
- push/merge decisions

Not for blindly trusting the overnight work.

---

## Best Division Of Labor For You

Since you are vibecoding your first project, the simplest working model is:

### At night

- You choose the lane
- You or a big model prepare the packets
- ClawdBot runs the builder packets locally
- ClawdBot commits locally on the lane branch

### In the morning

- For the pilot: Claude reviews diffs, packet compliance, and overall branch safety
- After calibration: ChatGPT and Gemini can be added for second-pass review or browser/UX verification
- You decide what is accepted

This keeps your cognitive load low while still giving you strong review coverage.

---

## Best First Pilot

Do this first before anything more complex:

### Night 1

Lane:
- `ws01-nav-auth`

Before sleep, by you or a big model:
- create the shared `useRequireAuth` hook if you want that abstraction in this lane

Packets:
- remove fake unread badge
- apply `useRequireAuth` to `favorites/page.tsx`
- apply `useRequireAuth` to `quick-browse/page.tsx`

That is enough for the first night.

If that goes well:

### Night 2

Packets:
- apply `useRequireAuth` to remaining protected pages
- wire mobile favorites access
- remove dead settings rows

Only after that should you let ClawdBot touch swipe or listing detail.

---

## Exact Operating Procedure

### Step 1: Prepare the branch

Example:

```powershell
git checkout main
git pull
git checkout -b ws01-nav-auth
```

### Step 2: Hand ClawdBot only the night packet list

Do not hand it the entire revamp backlog.

Give it:
- the lane name
- the packet order
- the exact packet text
- the stop rules

### Step 3: Let it commit locally only

ClawdBot can commit after each accepted packet implementation on the branch.

It should not:
- push
- merge
- rebase
- clean unrelated files

### Step 4: Morning review

Run:

```powershell
git status
git log --oneline --decorate -n 10
```

Then review packet-by-packet with the big models.

### Step 5: Only then push

If the branch is good:

```powershell
git push origin ws01-nav-auth
```

Merge only after review and checkpoint pass.

---

## Recommended ClawdBot Master Instruction

Use something like this as the top-level instruction when you start the overnight run:

```text
You are the overnight builder agent for SwipeMarket.

Work only on the current lane branch.
Do not work on main.

You may only execute the packets I give you, in the order I give you.
Each packet is small and code-only.

Rules:
- Do not make product decisions.
- Do not choose between multiple options unless the packet explicitly tells you which one to use.
- Do not touch files not named in the packet unless you must, and if you must, stop and report the blocker instead.
- Do not change database schema.
- Do not use dashboards or external admin tools.
- Do not upgrade packages.
- Do not push or merge git branches.
- Do not use destructive git commands.
- Do not introduce new alert() calls.
- For tRPC mutation loading state, use isLoading, not isPending.

For each packet:
1. Read only the files listed in READ FIRST.
2. Make the exact requested change.
3. Stop when DONE WHEN is satisfied.
4. Commit locally with the packet id in the commit message.
5. Report changed files, tests run, blockers, and notes.

If a packet seems to require a schema change, external dashboard access, or a bigger refactor than stated, stop and report that packet as blocked.
If any packet is blocked, stop the entire overnight run.
Do not skip to later packets.
Commit only fully completed packets and then stop.
At the end of the run, write a short final status into `orchestration/_overnight_canary.md` with:
- completed packet ids
- blocked packet id, if any
- warnings
- anything that needs morning review
Do not git add or commit the canary file.
```

---

## Recommended Packet Shape For ClawdBot

Use this format:

```text
Packet ID: W01-P01
Type: CODE_ONLY
Lane: ws01-nav-auth

Task:
Remove the fake unread badge on the mobile Messages tab.

Read first:
- components/layout/BottomNav.tsx

Change:
- Delete the hardcoded red dot shown for the Poruke tab.
- Do not add real unread logic in this packet.

Do not touch:
- Header.tsx
- any router files
- any other nav items

Done when:
- the Poruke tab shows no hardcoded red dot

Reply with:
- changed files
- tests run
- blockers
- notes
```

That is the right size for your local model.

---

## When To Stop The Overnight Run

Tell ClawdBot to stop for the night if any of these happen:

- it hits a schema-required packet
- it needs a third unrelated file not listed in the packet
- it is unsure which implementation path to choose
- it detects a hot-file conflict
- a test fails and it cannot explain why
- the branch becomes confusing or tangled
- it finishes the assigned packet list

Stopping safely is better than improvising.

Important stop rule:
- if one packet is blocked, stop the entire run
- do not skip ahead to packet 3, 4, or 5
- sequential packets may depend on the earlier packet even if that dependency is not obvious to a smaller model

---

## What You Should Ask The Big Models In The Morning

### For Claude

Ask:
- "Review this packet diff for bugs, regressions, or incomplete wiring."

Use Claude mainly for:
- patch review
- stitching
- harder code critique

### For ChatGPT

Ask:
- "Did this patch follow the packet exactly? Anything outside scope? Any process risk?"

Use ChatGPT mainly for:
- packet compliance
- queue/status sanity
- prompt reshaping for the next night

### For Gemini

Ask:
- "Use the checkpoint to verify whether this lane behaves correctly in browser/UI terms."

Use Gemini mainly for:
- checkpoint sanity
- browser/UI verification
- fresh-eye critique

---

## The Most Important Rule For You

Do not try to automate the whole project overnight.

Automate only the boring, local, reversible parts.

You should sleep while ClawdBot does:
- wiring
- cleanup
- small hook applications
- low-risk UI edits

You should stay in control of:
- product choices
- review decisions
- merges
- schema changes
- anything trust/safety critical

That is the right balance for a first project.

---

## One-Sentence Summary

The safe way to use ClawdBot overnight is to let it do only tiny, code-only, reversible builder packets on a non-main lane branch, then use Claude, ChatGPT, and Gemini in the morning to review, verify, and decide what gets pushed or merged.
