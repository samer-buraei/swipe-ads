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

## How To Use This File

- Start with `P0` items before adding new surface area.
- Treat "broken connection" items as higher priority than "missing nice-to-have feature" items.
- When implementing an item, update its checkbox and add a short note under `Implementation Notes`.
- If a task splits into multiple PRs, keep the original item here and add sub-notes rather than duplicating it elsewhere.

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

- [ ] Remove or wire all dead buttons and fake affordances.
  Why this is needed: dead controls reduce trust immediately and make the app feel unfinished.
  Known examples: swipe info button, chat image button, chat overflow menu, profile "Prikaži sve oglase", premium settings row.

- [ ] Add duplicate-report protection.
  Why this is needed: one user should not be able to repeatedly report the same listing and force moderation state changes.
  Current gap: report abuse can be used as a visibility attack.

- [ ] Make saved-search notifications honor the saved filters.
  Why this is needed: irrelevant notifications train users to ignore the feature.
  Current gap: backend matching does not fully respect saved search intent such as price or conditions.

- [ ] Make swipe undo a real undo.
  Why this is needed: UI state and stored state must match.
  Current gap: the card returns visually, but persisted swipe/favorite side effects may remain.

- [ ] Reconcile optimistic and realtime chat messages correctly.
  Why this is needed: messaging has to feel exact and dependable.
  Current gap: senders can see duplicate copies of the same message.

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

- [ ] Allow image reordering before submit.
  Why this is needed: the first image has an outsized effect on clickthrough.

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

## One-Sentence Summary

SwipeMarket already has the main surfaces of a classifieds app plus a swipe UI, but it still needs the connection logic, trust layer, and transaction mechanics that make the product complete, practical, and credible at real-user scale.
