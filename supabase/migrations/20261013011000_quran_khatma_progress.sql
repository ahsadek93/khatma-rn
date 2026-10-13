create table public.quran_khatma_juz (
  khatma_id uuid not null references public.khatmas (id) on delete cascade,
  juz_number integer not null check (juz_number between 1 and 30),
  status text not null default 'free' check (status in ('free', 'claimed', 'completed')),
  claimed_by uuid,
  claimed_at timestamptz,
  completed_by uuid,
  completed_at timestamptz,
  primary key (khatma_id, juz_number),
  check (
    (status = 'free' and claimed_by is null and claimed_at is null and completed_by is null and completed_at is null)
    or (status = 'claimed' and claimed_by is not null and claimed_at is not null and completed_by is null and completed_at is null)
    or (status = 'completed' and claimed_by is not null and claimed_at is not null and completed_by = claimed_by and completed_at is not null)
  )
);

create index quran_khatma_juz_claimed_by_idx
  on public.quran_khatma_juz (khatma_id, claimed_by);

alter table public.quran_khatma_juz enable row level security;
grant select on public.quran_khatma_juz to authenticated;

create policy "Khatma members can read Quran Juz"
  on public.quran_khatma_juz for select to authenticated
  using (public.is_khatma_member(khatma_id));

create function public.initialize_quran_khatma_juz()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.quran_khatma_juz (khatma_id, juz_number)
  select new.id, generate_series(1, 30);
  return new;
end;
$$;

create trigger initialize_quran_khatma_juz
  after insert on public.khatmas
  for each row execute function public.initialize_quran_khatma_juz();

insert into public.quran_khatma_juz (khatma_id, juz_number)
select k.id, generate_series(1, 30)
from public.khatmas k
on conflict (khatma_id, juz_number) do nothing;

create function public.claim_quran_juz(target_khatma_id uuid, target_juz_number integer)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  updated_count integer;
begin
  if (select auth.uid()) is null or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Khatma members can claim Juz';
  end if;

  update public.quran_khatma_juz
  set status = 'claimed', claimed_by = (select auth.uid()), claimed_at = now()
  where khatma_id = target_khatma_id and juz_number = target_juz_number and status = 'free';

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'Juz is unavailable';
  end if;
end;
$$;
revoke all on function public.claim_quran_juz(uuid, integer) from public;
grant execute on function public.claim_quran_juz(uuid, integer) to authenticated;

create function public.release_quran_juz(target_khatma_id uuid, target_juz_number integer)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  updated_count integer;
begin
  if (select auth.uid()) is null or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Khatma members can release Juz';
  end if;

  update public.quran_khatma_juz
  set status = 'free', claimed_by = null, claimed_at = null
  where khatma_id = target_khatma_id and juz_number = target_juz_number
    and status = 'claimed' and claimed_by = (select auth.uid());

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'You do not hold this Juz';
  end if;
end;
$$;
revoke all on function public.release_quran_juz(uuid, integer) from public;
grant execute on function public.release_quran_juz(uuid, integer) to authenticated;

create function public.complete_quran_juz(target_khatma_id uuid, target_juz_number integer)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  updated_count integer;
begin
  if (select auth.uid()) is null or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Khatma members can complete Juz';
  end if;

  update public.quran_khatma_juz
  set status = 'completed', completed_by = (select auth.uid()), completed_at = now()
  where khatma_id = target_khatma_id and juz_number = target_juz_number
    and status = 'claimed' and claimed_by = (select auth.uid());

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'You can only complete a Juz you claimed';
  end if;
end;
$$;
revoke all on function public.complete_quran_juz(uuid, integer) from public;
grant execute on function public.complete_quran_juz(uuid, integer) to authenticated;
