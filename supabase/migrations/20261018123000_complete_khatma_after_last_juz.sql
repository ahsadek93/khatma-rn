create or replace function public.complete_quran_juz(target_khatma_id uuid, target_juz_number integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Only Khatma members can complete Juz';
  end if;

  perform 1
  from public.khatmas
  where id = target_khatma_id
  for update;

  if not found or not public.is_khatma_member(target_khatma_id) then
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

  if (
    select count(*)
    from public.quran_khatma_juz
    where khatma_id = target_khatma_id and status = 'completed'
  ) = 30 then
    update public.khatmas
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = target_khatma_id and status = 'active';
  end if;
end;
$$;

revoke all on function public.complete_quran_juz(uuid, integer) from public;
grant execute on function public.complete_quran_juz(uuid, integer) to authenticated;
