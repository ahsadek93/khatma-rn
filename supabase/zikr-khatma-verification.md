# Zikr Khatma database verification

Apply the migrations, then use two authenticated test accounts: one Khatma
owner and one member. Make RPC calls through the app's Supabase client so
`auth.uid()` reflects the signed-in user. The SQL checks below can run in the
Supabase SQL editor after each operation.

## Create and backfill

1. Create a Zikr Khatma using `create_zikr_khatma` with a name, phrase, and
   goal of `1000`; confirm it appears with type `zikr`, status `active`, and
   the owner in `khatma_members`.
2. Confirm an existing Khatma has `khatma_type = 'quran'` after migration.
3. Confirm a blank phrase, blank name, or non-positive goal is rejected.

## Claims and aggregate counts

Call `set_zikr_khatma_claim` through the authenticated client with
`target_amount: 100`, then verify the member's pending amount is 100. Sign in
as a second member and claim 100. Then run:

```sql
select
  s.goal_count,
  coalesce(sum(p.completed_count), 0) as completed,
  coalesce(sum(p.pending_count), 0) as pending,
  s.goal_count - coalesce(sum(p.completed_count + p.pending_count), 0) as free
from public.zikr_khatma_settings s
left join public.zikr_khatma_member_progress p using (khatma_id)
where s.khatma_id = '<KHATMA_ID>'
group by s.goal_count;
```

Expected: `1000 / 0 / 200 / 800`. The details RPC should return the same group
totals and the signed-in member's own pending amount.

1. Edit one member's pending amount from 100 to 150. Expected totals: 0
   completed, 250 pending, 750 free.
2. Release that member's claim. Expected totals: 0 completed, 100 pending,
   900 free.
3. Try a claim that exceeds the remaining free count. The RPC must return an
   error and leave all counts unchanged.
4. Complete the remaining 100 claim in one step. Expected totals: 100
   completed, 0 pending, 900 free. The member can then claim another amount.

## Concurrency and permissions

1. With only 100 free, submit claims whose combined amount is greater than 100
   at the same time from two members. At most one request may succeed; the
   aggregate pending count must never exceed the goal after accounting for
   completed counts.
   For a repeatable setup, create a separate test Khatma with a goal of 100
   and have both members claim 60 concurrently.
2. As a nonmember, verify selecting Zikr settings and progress returns no
   rows. As a member, verify both are readable.
3. As a member who is not the owner, verify updating the phrase or goal fails.
   Verify another member cannot edit, release, or complete the owner's pending
   amount.

## Owner edits and completion

1. As owner, correct the phrase and increase the goal while the Khatma is
   active. Verify both changes are visible to members.
2. Try lowering the goal; the RPC must fail and preserve the existing goal.
3. Complete claims until the completed total equals the goal. Verify the shared
   Khatma status changes to `completed` and `completed_at` is set.
4. Verify claims, release/completion actions, and phrase/goal edits fail after
   completion.

Use this query to inspect the shared lifecycle state:

```sql
select khatma_type, status, completed_at
from public.khatmas
where id = '<KHATMA_ID>';
```
