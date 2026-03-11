Packet ID: W01-P03
Type: CODE_ONLY
Lane: ws01-nav-auth
Touch budget: 1 file

Task:
Apply the shared `useRequireAuth` hook to Quick Browse and stop its protected deck query from firing before auth resolves.

Read first:
- `app/quick-browse/page.tsx`
- `lib/hooks/useRequireAuth.ts`

Change:
- Import `useRequireAuth` from `@/lib/hooks/useRequireAuth`.
- Call `const { user, isLoading: authLoading } = useRequireAuth()`.
- Update the `api.swipe.getDeck.useQuery` call so it only runs when auth is ready and a user exists:
  - use the second-argument options object
  - set `enabled: !!user && !authLoading`
- While `authLoading` is true, render `SwipeDeckSkeleton`.
- If `!user && !authLoading`, return `null`.

Do not touch:
- `components/listings/SwipeDeck.tsx`
- swipe mechanics
- router files

Done when:
- the quick-browse deck query waits for auth before running
- signed-out users are redirected to `/login` cleanly
- signed-in users still see the swipe deck and empty-deck refetch behavior

Reply with:
- changed files
- tests run
- blockers
- notes
