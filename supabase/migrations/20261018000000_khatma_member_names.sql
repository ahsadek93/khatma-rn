create function public.get_khatma_member_details(target_khatma_id uuid)
returns table (
  user_id uuid,
  role text,
  joined_at timestamptz,
  display_name text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_khatma_member(target_khatma_id) then
    raise exception 'Only Khatma members can view participant names';
  end if;

  return query
  select
    m.user_id,
    m.role,
    m.joined_at,
    nullif(p.display_name, '')
  from public.khatma_members m
  left join public.profiles p on p.id = m.user_id
  where m.khatma_id = target_khatma_id
  order by m.joined_at;
end;
$$;

revoke all on function public.get_khatma_member_details(uuid) from public;
grant execute on function public.get_khatma_member_details(uuid) to authenticated;
