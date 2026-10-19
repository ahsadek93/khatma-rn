do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'zikr_khatma_member_progress'
    ) then
      execute 'alter publication supabase_realtime add table public.zikr_khatma_member_progress';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'zikr_khatma_settings'
    ) then
      execute 'alter publication supabase_realtime add table public.zikr_khatma_settings';
    end if;
  end if;
end;
$$;
