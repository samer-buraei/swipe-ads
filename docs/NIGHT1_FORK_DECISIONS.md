# Night 1 Fork Decisions

Last updated: 2026-03-11

These are the product and execution decisions chosen to unblock the first overnight ClawdBot run.

They are defaults for the pilot, not permanent laws.
If later review shows a better direction, these can be updated.

## Approved Decisions

### 1. BottomNav layout

Decision:
- `Početna`
- `Swipe`
- `Novo`
- `Sačuvano`
- `Poruke`

Why:
- Favorites is more important than direct profile access in the mobile bottom nav for this phase
- profile remains reachable from the header / direct route
- this unblocks the broken saved-items loop immediately

### 2. Swipe tap-to-detail mechanism

Decision:
- use both
- small-drag-or-tap opens detail
- visible info/details affordance also opens detail

Why:
- users need both an obvious explicit affordance and a natural tap path
- this reduces the chance that swipe feels like a dead-end surface

### 3. Listing gallery approach

Decision:
- custom gallery/lightbox built with existing project patterns and Framer Motion

Why:
- Framer Motion is already in the stack
- the gallery needs to match the app’s current design language
- adding a library is unnecessary for the first implementation

### 4. "Prikaži sve oglase" seller UX

Decision:
- toggle expand / collapse inside the profile page

Why:
- lowest-risk first implementation
- no new route needed
- good enough to close the dead-button gap quickly

### 5. Dead settings rows on profile

Decision:
- remove them for now

Rows affected:
- `Podešavanja naloga`
- `Premium nalog`

Why:
- fake settings rows damage trust
- they can be reintroduced later when real destinations exist

### 6. Fake trending section on home

Decision:
- remove it for now

Why:
- hardcoded fake trend data makes the app feel like a mockup
- real trend logic can be added later as a separate feature

## Pilot Scope Note

These decisions are enough to start the first overnight lane:
- `ws01-nav-auth`

They do not authorize larger product refactors.
