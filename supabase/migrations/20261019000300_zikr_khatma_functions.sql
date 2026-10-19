revoke all on public.zikr_khatma_settings from anon, authenticated, public;
revoke all on public.zikr_khatma_member_progress from anon, authenticated, public;
grant select on public.zikr_khatma_settings to authenticated;
grant select on public.zikr_khatma_member_progress to authenticated;

create function public.create_zikr_khatma(
  target_name text,
  target_phrase text,
  target_goal_count bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_khatma_id uuid;
begin
  if actor_id is null then
    raise exception 'Sign in before creating a Khatma';
  end if;
  if char_length(btrim(target_name)) not between 1 and 100 then
    raise exception 'Khatma name must contain between 1 and 100 characters';
  end if;
  if char_length(btrim(target_phrase)) not between 1 and 500 then
    raise exception 'Zikr phrase must contain between 1 and 500 characters';
  end if;
  if target_goal_count is null or target_goal_count <= 0 then
    raise exception 'Goal must be a positive count';
  end if;

  insert into public.khatmas (name, created_by, khatma_type)
  values (btrim(target_name), actor_id, 'zikr')
  returning id into new_khatma_id;

  insert into public.zikr_khatma_settings (khatma_id, phrase, goal_count)
  values (new_khatma_id, btrim(target_phrase), target_goal_count);

  return new_khatma_id;
end;
$$;
revoke all on function public.create_zikr_khatma(text, text, bigint) from public;
grant execute on function public.create_zikr_khatma(text, text, bigint) to authenticated;

create function public.get_zikr_khatma_details(target_khatma_id uuid)
returns table (
  phrase text,
  goal_count bigint,
  completed_count bigint,
  pending_count bigint,
  my_pending_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Khatma members can read Zikr progress';
  end if;

  return query
  select s.phrase,
         s.goal_count,
         coalesce(sum(p.completed_count), 0)::bigint,
         coalesce(sum(p.pending_count), 0)::bigint,
         coalesce(sum(p.pending_count) filter (where p.user_id = actor_id), 0)::bigint
  from public.zikr_khatma_settings s
  join public.khatmas k on k.id = s.khatma_id and k.khatma_type = 'zikr'
  left join public.zikr_khatma_member_progress p on p.khatma_id = s.khatma_id
  where s.khatma_id = target_khatma_id
  group by s.phrase, s.goal_count;

  if not found then
    raise exception 'Zikr Khatma not found';
  end if;
end;
$$;
revoke all on function public.get_zikr_khatma_details(uuid) from public;
grant execute on function public.get_zikr_khatma_details(uuid) to authenticated;

create function public.set_zikr_khatma_claim(target_khatma_id uuid, target_amount bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_status text;
  target_goal bigint;
  completed_total bigint;
  other_pending_total bigint;
begin
  if actor_id is null then
    raise exception 'Sign in before claiming Zikr';
  end if;
  if target_amount is null or target_amount <= 0 then
    raise exception 'Claim amount must be a positive count';
  end if;

  select k.status, s.goal_count into target_status, target_goal
  from public.khatmas k
  join public.zikr_khatma_settings s on s.khatma_id = k.id
  where k.id = target_khatma_id and k.khatma_type = 'zikr'
  for update of k;

  if not found or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Zikr Khatma members can claim';
  end if;
  if target_status <> 'active' then
    raise exception 'This Khatma is completed';
  end if;

  select coalesce(sum(p.completed_count), 0)::bigint,
         coalesce(sum(p.pending_count) filter (where p.user_id <> actor_id), 0)::bigint
  into completed_total, other_pending_total
  from public.zikr_khatma_member_progress p
  where p.khatma_id = target_khatma_id;

  if completed_total + other_pending_total + target_amount > target_goal then
    raise exception 'Claim exceeds the free Zikr count';
  end if;

  insert into public.zikr_khatma_member_progress (khatma_id, user_id, pending_count)
  values (target_khatma_id, actor_id, target_amount)
  on conflict (khatma_id, user_id)
  do update set pending_count = excluded.pending_count;
end;
$$;
revoke all on function public.set_zikr_khatma_claim(uuid, bigint) from public;
grant execute on function public.set_zikr_khatma_claim(uuid, bigint) to authenticated;

create function public.release_zikr_khatma_claim(target_khatma_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_status text;
begin
  if actor_id is null then
    raise exception 'Sign in before releasing a Zikr claim';
  end if;

  select k.status into target_status
  from public.khatmas k
  where k.id = target_khatma_id and k.khatma_type = 'zikr'
  for update;

  if not found or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Zikr Khatma members can release a claim';
  end if;
  if target_status <> 'active' then
    raise exception 'This Khatma is completed';
  end if;

  update public.zikr_khatma_member_progress
  set pending_count = 0
  where khatma_id = target_khatma_id and user_id = actor_id and pending_count > 0;

  if not found then
    raise exception 'You have no pending Zikr claim to release';
  end if;
end;
$$;
revoke all on function public.release_zikr_khatma_claim(uuid) from public;
grant execute on function public.release_zikr_khatma_claim(uuid) to authenticated;

create function public.complete_zikr_khatma_claim(target_khatma_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_status text;
  target_goal bigint;
  completed_total bigint;
  pending_total bigint;
begin
  if actor_id is null then
    raise exception 'Sign in before completing a Zikr claim';
  end if;

  select k.status, s.goal_count into target_status, target_goal
  from public.khatmas k
  join public.zikr_khatma_settings s on s.khatma_id = k.id
  where k.id = target_khatma_id and k.khatma_type = 'zikr'
  for update of k;

  if not found or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Zikr Khatma members can complete a claim';
  end if;
  if target_status <> 'active' then
    raise exception 'This Khatma is completed';
  end if;

  update public.zikr_khatma_member_progress
  set completed_count = completed_count + pending_count, pending_count = 0
  where khatma_id = target_khatma_id and user_id = actor_id and pending_count > 0;

  if not found then
    raise exception 'You have no pending Zikr claim to complete';
  end if;

  select coalesce(sum(p.completed_count), 0)::bigint,
         coalesce(sum(p.pending_count), 0)::bigint
  into completed_total, pending_total
  from public.zikr_khatma_member_progress p
  where p.khatma_id = target_khatma_id;

  if completed_total > target_goal then
    raise exception 'Completed Zikr count exceeds its goal';
  end if;
  if completed_total = target_goal and pending_total = 0 then
    update public.khatmas
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = target_khatma_id and status = 'active';
  end if;
end;
$$;
revoke all on function public.complete_zikr_khatma_claim(uuid) from public;
grant execute on function public.complete_zikr_khatma_claim(uuid) to authenticated;

create function public.update_zikr_khatma_settings(
  target_khatma_id uuid,
  target_phrase text,
  target_goal_count bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_status text;
  owner_id uuid;
  old_goal bigint;
begin
  if actor_id is null then
    raise exception 'Sign in before editing Zikr settings';
  end if;
  if char_length(btrim(target_phrase)) not between 1 and 500 then
    raise exception 'Zikr phrase must contain between 1 and 500 characters';
  end if;
  if target_goal_count is null or target_goal_count <= 0 then
    raise exception 'Goal must be a positive count';
  end if;

  select k.status, k.created_by, s.goal_count
  into target_status, owner_id, old_goal
  from public.khatmas k
  join public.zikr_khatma_settings s on s.khatma_id = k.id
  where k.id = target_khatma_id and k.khatma_type = 'zikr'
  for update of k;

  if not found or owner_id <> actor_id then
    raise exception 'Only the owner can edit Zikr settings';
  end if;
  if target_status <> 'active' then
    raise exception 'Completed Khatma settings cannot be changed';
  end if;
  if target_goal_count < old_goal then
    raise exception 'Zikr goal cannot be lowered';
  end if;

  update public.zikr_khatma_settings
  set phrase = btrim(target_phrase), goal_count = target_goal_count
  where khatma_id = target_khatma_id;
end;
$$;
revoke all on function public.update_zikr_khatma_settings(uuid, text, bigint) from public;
grant execute on function public.update_zikr_khatma_settings(uuid, text, bigint) to authenticated;
