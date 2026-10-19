do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'supabase_realtime publication does not exist';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'zikr_khatma_member_progress'
  ) then
    alter publication supabase_realtime add table public.zikr_khatma_member_progress;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'zikr_khatma_settings'
  ) then
    alter publication supabase_realtime add table public.zikr_khatma_settings;
  end if;
end;
$$;
