Packet ID: W01-P01
Type: CODE_ONLY
Lane: ws01-nav-auth
Touch budget: 1 file

Task:
Remove the fake unread badge on the mobile Messages tab.

Read first:
- `components/layout/BottomNav.tsx`

Change:
- Delete the hardcoded red notification dot rendered for the `Poruke` tab.
- Do not add real unread-count logic in this packet.

Do not touch:
- `components/layout/Header.tsx`
- any tRPC router
- any other nav item behavior

Done when:
- the `Poruke` tab shows no hardcoded red dot
- the bottom-nav layout and active indicator still behave the same

Reply with:
- changed files
- tests run
- blockers
- notes
