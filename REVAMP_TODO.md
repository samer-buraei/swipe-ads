# SwipeMarket Revamp TODO

Last updated: 2026-03-11

## Purpose

This file is the unified revamp backlog for SwipeMarket.

It combines:
- missing product features
- broken or incomplete logic connections
- partial implementations that exist in backend or UI but are not fully wired
- operational gaps for buyer, seller, admin, and swipe-specific flows

Use this as the working source of truth for follow-up implementation.

Related references:
- For source-verified current behavior, route coverage, button/code trace, and known gaps, read `STATUS.md`.
- For operational state, deployment history, and what previously worked or failed, read `AGENTS.md`.
- For the proposed multi-LLM execution model and prompt hierarchy, read `docs/LLM_EXECUTION_STRATEGY_REVIEW.md`.

## How To Use This File

- Start with `P0` items before adding new surface area.
- Treat "broken connection" items as higher priority than "missing nice-to-have feature" items.
- When implementing an item, update its checkbox and add a short note under `Implementation Notes`.
- If a task splits into multiple PRs, keep the original item here and add sub-notes rather than duplicating it elsewhere.
- Use the `Execution Workstreams` section below after choosing the next backlog item. It contains the merged high-medium-level implementation guidance.

## Priority Legend

- `P0`: broken journeys, trust issues, fake affordances, or data integrity problems
- `P1`: required to make the app behave like a real classifieds marketplace
- `P2`: operational, trust/safety, and business maturity gaps
- `P3`: differentiation and deeper product polish

## Recommended Build Order

1. Fix broken connections and dead flows.
2. Complete listing inspection and buyer trust surfaces.
3. Complete messaging into negotiation.
4. Complete seller inventory management and analytics.
5. Complete admin and trust/safety operations.
6. Deepen the swipe layer into a true differentiator.

## Verification Discipline

Treat each workstream as a checkpoint, not as one long coding session.

After each completed workstream:
- run `npx vitest run`
- run `npm run typecheck`
- run `npm run lint`
- manually verify the primary affected routes in the browser

Checkpoint groups:
- After navigation, swipe, and listing-detail changes: verify home, quick browse, favorites, listing detail, seller profile links, and signed-out redirects.
- After messaging and first-contact changes: verify both message surfaces, first-contact flow, and duplicate-message behavior.
- After seller-management and profile-trust changes: verify profile, edit listing, full inventory management, analytics, and visible trust indicators.
- After saved-search, abuse, and admin changes: verify notification relevance, report/rating protection, and admin operations end to end.

## P0 - Broken Connections And Critical Practical Gaps

- [ ] Wire swipe cards to listing detail.
  Why this is needed: swipe is currently a decision surface without enough inspection. In classifieds, users must be able to inspect before saving or skipping.
  Current gap: the visible swipe info affordance is dead and the card itself is not a usable tap-to-detail entry point.

- [ ] Restore favorites access on mobile.
  Why this is needed: users can save items, but mobile users do not have a reliable way to reopen saved items from the main navigation.
  Current gap: the feature works in data terms but fails as a real user loop on the most important device class.

- [ ] Improve auth boundary behavior on protected routes.
  Why this is needed: signed-out users should hit a clear login handoff instead of weak loading/error states.
  Current gap: routes like swipe, favorites, messages, and posting do not always fail gracefully for unauthenticated users.
  Execution note: use one shared auth-gate pattern such as a `useRequireAuth()` hook with return-URL support instead of each page hand-rolling `supabase.auth.getUser()` + redirect behavior.

- [ ] Remove or wire all dead buttons and fake affordances.
  Why this is needed: dead controls reduce trust immediately and make the app feel unfinished.
  Known examples: swipe info button, chat image button, chat overflow menu, profile "Prikaži sve oglase", premium settings row, fake unread badge on "Poruke".

- [ ] Link the listing-detail seller card to the public seller profile.
  Why this is needed: the public seller profile exists, but buyers cannot naturally reach it from the highest-value trust surface.
  Current gap: seller name/card on listing detail is a dead end instead of a trust-expansion path.

- [ ] Add duplicate-report protection.
  Why this is needed: one user should not be able to repeatedly report the same listing and force moderation state changes.
  Current gap: report abuse can be used as a visibility attack.

- [ ] Make saved-search notifications honor the saved filters.
  Why this is needed: irrelevant notifications train users to ignore the feature.
  Current gap: backend matching does not fully respect saved search intent such as price or conditions.

- [ ] Make swipe undo a real undo.
  Why this is needed: UI state and stored state must match.
  Current gap: the card returns visually, but persisted swipe/favorite side effects may remain.
  Execution note: the current `handleUndo` behavior is local-only. Real undo likely needs a dedicated `swipe.undo` mutation that removes the stored swipe event and reverses any favorite side effect.

- [ ] Reconcile optimistic and realtime chat messages correctly.
  Why this is needed: messaging has to feel exact and dependable.
  Current gap: senders can see duplicate copies of the same message.
  Execution note: the current duplicate path is optimistic ids like `optimistic-${Date.now()}` in the UI versus realtime/server UUIDs, so id-only dedup is not enough.

- [ ] Support common mobile image formats end to end.
  Why this is needed: sellers often post directly from phone camera rolls.
  Current gap: HEIC support is inconsistent across contracts, UI, and upload handling.

- [ ] Expand admin action coverage for harmful content and harmful users.
  Why this is needed: moderation requires more than approve/reject.
  Current gap: admin actions are too narrow for real abuse handling.

## P1 - Buyer Marketplace Core

- [ ] Build a proper listing image gallery and lightbox.
  Why this is needed: photos are the main decision surface in classifieds.
  Includes: full-screen viewer, swipe/arrows, zoom, image count, mobile-friendly browsing.

- [ ] Add category-specific specification rendering on listing detail.
  Why this is needed: buyers expect structured specs, not just generic description text, especially in verticals like vehicles and real estate.
  Execution note: use listing attributes already returned by detail responses and render structured sections rather than raw JSON.

- [ ] Add breadcrumbs / category context on listing detail.
  Why this is needed: buyers need navigation context and a path back to browse flows.

- [ ] Add a phone reveal pattern on listing detail.
  Why this is needed: showing the seller phone only after a deliberate "Prikaži broj" action matches user expectations in the region and creates a useful trust/intent signal.

- [ ] Add custom first message when contacting a seller.
  Why this is needed: buyers need control over tone and intent from the first touchpoint.
  Current gap: contact starts with forced template text.

- [ ] Add a structured offer / negotiate flow.
  Why this is needed: plain chat is not enough to support real marketplace negotiation.
  This is the biggest transaction-layer gap in the product.

- [ ] Support image attachments in chat.
  Why this is needed: buyers and sellers commonly exchange extra photos, receipts, measurements, or defect proof.
  Current gap: the affordance exists but does nothing.

- [ ] Add conversation management.
  Why this is needed: messaging volume becomes unusable without controls.
  Includes: archive/delete conversation, block user, seller filtering by listing, clearer unread state.

- [ ] Surface read state clearly in chat.
  Why this is needed: people need to know whether a message was seen before sending repeats.
  Current gap: backend tracks state, but the UI does not present it as a meaningful communication signal.

- [ ] Add listing freshness signals.
  Why this is needed: buyers judge availability and urgency from recency.
  Includes: posted x days ago, recently updated, price reduced.

- [ ] Add similar / related listings on the listing detail page.
  Why this is needed: listing detail should not be a dead end.
  This increases recovery, engagement, and session depth.

- [ ] Add recently viewed listings.
  Why this is needed: buyers compare items over time and need a path back.

- [ ] Add visible sort controls in search and browse.
  Why this is needed: buyers expect basic control over newest and price order.
  Current gap: sorting exists in backend logic but not in the user-facing controls.

- [ ] Add proper result pagination or infinite scroll.
  Why this is needed: hard result caps make search feel small and unreliable as inventory grows.

- [ ] Improve price filtering UX.
  Why this is needed: min/max text boxes are functional but weak for fast browsing.
  Consider: better controls, presets, or range interaction.

- [ ] Replace free-text city filtering with canonical selection.
  Why this is needed: typos and inconsistent city names weaken search quality and saved search matching.

- [ ] Plan and introduce subcategories for major verticals.
  Why this is needed: a permanently flat category model is too coarse for areas like vehicles and real estate.
  Scope note: this is not a P0 taxonomy rewrite, but the direction should be defined before search/discovery gets deeper.

- [ ] Replace or remove fake trending / featured content.
  Why this is needed: hardcoded product signals make the app feel like a mockup instead of a live marketplace.

- [ ] Strengthen listing trust context.
  Why this is needed: buyers need context before messaging.
  Consider: view count, seller listing count, save count, seller response signals, stronger seller identity block.

## P1 - Seller Operating Loop

- [ ] Make all seller listings reachable and manageable from profile.
  Why this is needed: sellers need a full inventory management loop, not just a preview of the first few items.
  Current gap: the "show all" action is dead.

- [ ] Add seller analytics.
  Why this is needed: sellers need feedback to improve titles, prices, photos, and response behavior.
  Includes: views, saves, inquiry count.

- [ ] Expose the negotiable price flag in create and edit flows.
  Why this is needed: negotiation intent is a standard marketplace signal.
  Current gap: the data model already supports it, but sellers cannot set it in the UI.

- [ ] Add draft listings.
  Why this is needed: sellers often gather photos and details in stages.

- [ ] Add duplicate / repost listing flow.
  Why this is needed: repeat sellers should not recreate similar listings from scratch.

- [ ] Add listing expiration / auto-archive rules.
  Why this is needed: stale inventory destroys trust over time if old listings remain active forever.

- [ ] Add renew / bump listing controls.
  Why this is needed: once listings can expire or age out, sellers need an explicit way to refresh them.

- [ ] Allow image reordering before submit.
  Why this is needed: the first image has an outsized effect on clickthrough.
  Execution note: image management should eventually cover reorder, add, and remove both before and after publish.

- [ ] Improve post-publish image management.
  Why this is needed: sellers often want to replace, reorder, or add better photos after publishing.

- [ ] Display bio consistently on profile surfaces.
  Why this is needed: seller identity and trust depend on visible profile context, not just stored fields.

- [ ] Surface seller rating clearly on own and public profiles.
  Why this is needed: reputation is only useful if it is visible.
  Current gap: ratings exist, but profile presentation is incomplete.

- [ ] Add response-time and response-rate indicators.
  Why this is needed: buyers favor responsive sellers, and sellers benefit from visible trust signals.

## P2 - Trust, Safety, And Admin Operations

- [ ] Add admin user management.
  Why this is needed: the business cannot be operated from listing moderation alone.
  Includes: user list, profile access, listing history, moderation history.

- [ ] Add ban, suspend, and verify-user controls.
  Why this is needed: user-level trust actions are mandatory once abuse appears.

- [ ] Add admin analytics dashboard.
  Why this is needed: operating the marketplace requires visibility into growth, backlog, and moderation workload.
  Includes: active listings, new users, pending reports, moderation throughput.

- [ ] Add moderation audit trail and reason visibility.
  Why this is needed: internal operations and future appeals require traceability.
  Includes: moderation reason fields, `resolved_by`, and enough history to understand who acted, when, and why.

- [ ] Add user blocking across messaging and profile interactions.
  Why this is needed: peer-to-peer marketplaces need a direct safety escape hatch.

- [ ] Add delete account and privacy settings.
  Why this is needed: these become expected as soon as the app handles identity, messaging, and saved preferences.

- [ ] Add notification preferences.
  Why this is needed: users should control which marketplace events can interrupt them.

- [ ] Tighten rating abuse rules.
  Why this is needed: ratings should reflect meaningful interaction, not casual or hostile drive-by input.
  Consider: require message thread, seller response, offer interaction, or completed transaction state.

- [ ] Expand anti-spam rules for future offers and negotiation flows.
  Why this is needed: adding structured commerce will expand abuse vectors, so the protection model needs to mature with it.

- [ ] Centralize exchange-rate and other shared cross-surface logic.
  Why this is needed: the same concept should not be implemented differently on cards, detail pages, and other surfaces because that creates trust-eroding inconsistencies.

- [ ] Add legal and support shell pages.
  Why this is needed: a real marketplace needs visible Terms, Privacy Policy, Impressum/company info, and support entry points before broad launch.

- [ ] Add a desktop footer with legal/support/navigation anchors.
  Why this is needed: the product currently ends like a prototype instead of a real marketplace surface.

## P3 - Swipe Layer Differentiation

- [ ] Add image browsing inside swipe cards.
  Why this is needed: swipe only becomes useful for classifieds if users can inspect without leaving the mode.

- [ ] Add image-count or dot indicators on swipe cards.
  Why this is needed: buyers should know whether a listing has a rich gallery or a single weak photo.

- [ ] Add in-context swipe deck filters.
  Why this is needed: users should not have to leave swipe mode to narrow the feed.
  Includes: category, city, price, condition.

- [ ] Add personalized ranking based on swipe behavior.
  Why this is needed: recorded swipes should improve future discovery, otherwise the swipe layer is cosmetic.

- [ ] Add a stronger swipe-specific commitment action.
  Why this is needed: if swipe is the differentiator, it needs more than left/right.
  Consider: swipe up, super-save, instant message, or instant offer flow.

- [ ] Design the marketplace equivalent of a "match" moment.
  Why this is needed: swipe-based products benefit from a meaningful interaction milestone.
  Candidate triggers: seller reply, accepted offer, mutual engagement event.

- [ ] Add local discovery enhancements.
  Why this is needed: location is one of the strongest natural advantages in classifieds.
  Consider: map view, distance sorting, nearby-first deck variants.

- [ ] Add high-signal marketplace badges and triggers.
  Why this is needed: buyers make faster decisions when the product surfaces useful urgency and quality cues.
  Consider: hot listing, recently reduced, highly saved, responsive seller.

## Implementation Notes

- Keep P0 items focused on trust, integrity, and completing existing journeys.
- Do not add more decorative surface area before core listing detail, messaging, and seller management are complete.
- Prefer wiring existing backend support before inventing new backend complexity where possible.
- When a feature already exists partially in backend or schema, finish the full loop instead of rebuilding it from scratch.
- In this codebase, tRPC mutation loading state is typically `isLoading`, not `isPending`.

## Execution Workstreams

Use these as the high-medium-level implementation tracks for other agents. Pick from the backlog above, then use the matching workstream below to understand scope, likely files, and common mistakes.

### 1. Navigation And Auth Cleanup

- Goal: make all key destinations reachable and make signed-out behavior consistent.
- Reuse: `components/layout/BottomNav.tsx`, `components/layout/Header.tsx`, protected pages under `app/`.
- Build: mobile favorites access, remove fake unread badge, wire/remove dead settings rows, and unify auth-gate behavior with a shared pattern.
- Avoid: per-page auth logic drift and fake badges left in place "temporarily".

### 2. Swipe Journey Completion

- Goal: turn swipe into a usable classifieds discovery mode rather than a gimmick.
- Reuse: `components/listings/SwipeDeck.tsx`, `app/quick-browse/page.tsx`, `server/api/routers/swipe.ts`.
- Build: tap-to-detail, real info action, real undo, and deck refill behavior that responds to refetches.
- Avoid: local-only undo and tap handlers that break drag gestures.

### 3. Listing Detail Completion

- Goal: make the listing page strong enough for real purchase decisions.
- Reuse: `app/listing/[slug]/page.tsx`, `components/listings/ListingCard.tsx`, `components/listings/DynamicAttributeFields.tsx`, `server/api/routers/listing.ts`.
- Build: gallery/lightbox, category-specific specs, breadcrumbs, freshness/view signals, phone reveal, and seller profile linking.
- Avoid: tiny-thumbnail-only image UX, raw attribute dumps, and dead-end seller trust surfaces.

### 4. Search And Discovery Unification

- Goal: make home search, header search, and the search page feel like one product.
- Reuse: `app/page.tsx`, `app/search/page.tsx`, `components/search/SearchBar.tsx`, `components/listings/ListingGrid.tsx`, `server/api/routers/listing.ts`.
- Build: visible sort controls, scalable result loading, cleaner city/category filters, and a future-ready subcategory direction for major verticals.
- Avoid: UI controls that do not map to real backend support and duplicate search logic in multiple places.

### 5. Messaging Reliability

- Goal: stabilize chat before adding attachments, offers, or richer communication states.
- Reuse: `app/messages/[id]/page.tsx`, `components/messages/ConversationView.tsx`, `components/messages/useRealtimeMessages.ts`, `server/api/routers/message.ts`.
- Build: optimistic/realtime reconciliation, clearer read-state UI, and consistency across the two message surfaces.
- Avoid: id-only dedup if optimistic ids and server ids differ.

### 6. First Contact And Negotiation Entry

- Goal: make seller contact flexible, then add a simple structured offer layer.
- Reuse: `app/listing/[slug]/page.tsx`, `server/api/routers/message.ts`.
- Build: editable first-contact message first; only then add offers with explicit statuses such as sent, countered, accepted, rejected, or withdrawn.
- Avoid: treating offers as a trivial chat tweak or jumping straight to payments.

### 7. Seller Inventory Loop

- Goal: let sellers manage listings like inventory, not just individual posts.
- Reuse: `app/profile/page.tsx`, `app/listing/[slug]/edit/page.tsx`, `app/new/page.tsx`, `server/api/routers/listing.ts`.
- Build: real all-listings management, stronger edit flow, image reorder/add/remove, negotiable flag, duplicate/repost, expiration, and renew/bump.
- Avoid: leaving create and edit mismatched, or adding expiration without a renew path.

### 8. Profile Trust Surfaces

- Goal: make profile data visible and useful before deeper seller-quality features.
- Reuse: `app/profile/page.tsx`, `app/profile/[userId]/page.tsx`, `server/api/routers/user.ts`, `server/api/routers/rating.ts`.
- Build: visible bio, real rating summary, stronger verification/member-since context, and better seller reputation display.
- Avoid: storing fields the buyer never sees or leaving ratings hardcoded to placeholders.

### 9. Seller Analytics And Response Signals

- Goal: give sellers actionable feedback and give buyers stronger responsiveness signals.
- Reuse: existing views, favorites, conversations, and profile surfaces.
- Build: views, saves, inquiry counts, response rate, response time, and sold context.
- Avoid: starting with a fancy dashboard instead of a few reliable numbers.

### 10. Saved Search Integrity

- Goal: make saved searches discoverable and make alerts trustworthy.
- Reuse: `app/search-profiles/page.tsx`, `server/api/routers/searchProfile.ts`, push-matching logic in `server/api/routers/listing.ts`.
- Build: better discoverability plus matching that respects keyword, category, city, `minPrice`, `maxPrice`, and `conditions`.
- Avoid: sending more alerts before relevance is fixed.

### 11. Abuse And Safety Controls

- Goal: close obvious abuse vectors before they scale.
- Reuse: `server/api/routers/report.ts`, `server/api/routers/rating.ts`, `server/api/routers/message.ts`, admin surfaces.
- Build: duplicate-report protection, tighter rating eligibility, user blocking, and stronger server-side safety constraints.
- Avoid: trusting UI-only restrictions for abuse prevention.

### 12. Admin Operations Panel

- Goal: let admins operate the marketplace without raw SQL for normal tasks.
- Reuse: `app/admin/page.tsx`, `server/api/routers/admin.ts`, admin gating in `server/api/trpc.ts`.
- Build: user management, moderation reasons, audit trail, analytics, and likely new components under `components/admin/`.
- Avoid: treating this as a light UI task; it is backend-heavy because the current admin router is narrow.

### 13. Shared Logic Centralization

- Goal: remove logic drift where the same concept is implemented multiple ways.
- Reuse: exchange-rate logic, messaging logic, and any cross-surface helper duplication.
- Build: one obvious implementation path for shared concepts.
- Avoid: long-lived "temporary" duplicate implementations.

### 14. Legal And Support Shell

- Goal: add the non-feature surfaces needed before broad launch claims.
- Reuse: app layout and navigation structure.
- Build: legal pages, footer, and basic support/about access.
- Avoid: forgetting this until after launch, but also avoid doing it before core user loops work.

### 15. Swipe Differentiation Later

- Goal: deepen swipe only after the marketplace core is solid.
- Reuse: `components/listings/SwipeDeck.tsx`, `server/api/routers/swipe.ts`.
- Build: in-card image browsing, filters, stronger actions, ranking, and a meaningful marketplace equivalent of a "match".
- Avoid: prioritizing this above trust, detail, messaging, or seller operations.

## One-Sentence Summary

SwipeMarket already has the main surfaces of a classifieds app plus a swipe UI, but it still needs the connection logic, trust layer, and transaction mechanics that make the product complete, practical, and credible at real-user scale.
