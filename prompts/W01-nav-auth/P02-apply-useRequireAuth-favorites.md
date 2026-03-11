Packet ID: W01-P02
Type: CODE_ONLY
Lane: ws01-nav-auth
Touch budget: 1 file

Task:
Apply the shared `useRequireAuth` hook to the Favorites page and stop its protected query from firing before auth resolves.

Read first:
- `app/favorites/page.tsx`
- `lib/hooks/useRequireAuth.ts`

Change:
- Import `useRequireAuth` from `@/lib/hooks/useRequireAuth`.
- Remove the old inline `useEffect` auth check and the `createClient` import.
- Call `const { user, isLoading: authLoading } = useRequireAuth()`.
- Update the `api.favorite.list.useQuery` call so it only runs when auth is ready and a user exists:
  - use the second-argument options object
  - set `enabled: !!user && !authLoading`
- While `authLoading` is true, return the same loading skeleton already used on the page.
- If `!user && !authLoading`, return `null`.

Do not touch:
- `components/listings/ListingCard.tsx`
- router files
- empty-state copy

Done when:
- the page no longer contains an inline Supabase auth `useEffect`
- the favorites query waits for auth before running
- signed-out users are redirected to `/login` cleanly

Reply with:
- changed files
- tests run
- blockers
- notes
