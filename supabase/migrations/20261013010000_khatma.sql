create table public.khatmas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.khatma_members (
  id uuid primary key default gen_random_uuid(),
  khatma_id uuid not null references public.khatmas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (khatma_id, user_id)
);

alter table public.khatmas enable row level security;
alter table public.khatma_members enable row level security;
grant select on public.khatmas to authenticated;
grant insert (name, created_by) on public.khatmas to authenticated;
grant update (name) on public.khatmas to authenticated;
grant select on public.khatma_members to authenticated;

create function public.is_khatma_member(target_khatma_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.khatma_members m
    where m.khatma_id = target_khatma_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_khatma_member(uuid) from public;
grant execute on function public.is_khatma_member(uuid) to authenticated;

create function public.join_khatma_by_code(requested_code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  target_khatma_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before joining a Khatma';
  end if;

  select k.id into target_khatma_id
  from public.khatmas k
  where k.join_code = upper(trim(requested_code)) and k.status = 'active';

  if target_khatma_id is null then
    raise exception 'Khatma code is invalid or inactive';
  end if;

  insert into public.khatma_members (khatma_id, user_id)
  values (target_khatma_id, (select auth.uid()))
  on conflict (khatma_id, user_id) do nothing;

  return target_khatma_id;
end;
$$;
revoke all on function public.join_khatma_by_code(text) from public;
grant execute on function public.join_khatma_by_code(text) to authenticated;

create function public.add_khatma_creator_as_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.khatma_members (khatma_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger add_khatma_creator_as_owner
  after insert on public.khatmas
  for each row execute function public.add_khatma_creator_as_owner();

create policy "Members can read their khatmas"
  on public.khatmas for select to authenticated
  using (public.is_khatma_member(id));

create policy "Users can create khatmas"
  on public.khatmas for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "Owners can update khatmas"
  on public.khatmas for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "Members can read memberships"
  on public.khatma_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_khatma_member(khatma_id));
