create function public.get_khatma_juz_details(target_khatma_id uuid)
returns table (
  juz_number integer,
  status text,
  claimed_by uuid,
  claimed_by_name text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Khatma members can view Juz details';
  end if;

  return query
  select
    j.juz_number,
    j.status,
    j.claimed_by,
    case when j.claimed_by is null then null
      else coalesce(nullif(p.display_name, ''), 'A Khatma member')
    end
  from public.quran_khatma_juz j
  left join public.profiles p on p.id = j.claimed_by
  where j.khatma_id = target_khatma_id
  order by j.juz_number;
end;
$$;
revoke all on function public.get_khatma_juz_details(uuid) from public;
grant execute on function public.get_khatma_juz_details(uuid) to authenticated;
