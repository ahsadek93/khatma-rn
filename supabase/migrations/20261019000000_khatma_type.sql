alter table public.khatmas
  add column khatma_type text not null default 'quran'
  check (khatma_type in ('quran', 'zikr'));
