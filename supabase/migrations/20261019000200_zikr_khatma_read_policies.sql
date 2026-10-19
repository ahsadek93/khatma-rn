alter table public.zikr_khatma_settings enable row level security;
alter table public.zikr_khatma_member_progress enable row level security;

grant select on public.zikr_khatma_settings to authenticated;
grant select on public.zikr_khatma_member_progress to authenticated;

create policy "Khatma members can read Zikr settings"
  on public.zikr_khatma_settings for select to authenticated
  using (public.is_khatma_member(khatma_id));

create policy "Khatma members can read Zikr progress"
  on public.zikr_khatma_member_progress for select to authenticated
  using (public.is_khatma_member(khatma_id));
