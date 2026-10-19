create table public.zikr_khatma_settings (
  khatma_id uuid primary key references public.khatmas (id) on delete cascade,
  phrase text not null check (char_length(btrim(phrase)) between 1 and 500),
  goal_count bigint not null check (goal_count > 0)
);

create table public.zikr_khatma_member_progress (
  khatma_id uuid not null,
  user_id uuid not null,
  pending_count bigint not null default 0 check (pending_count >= 0),
  completed_count bigint not null default 0 check (completed_count >= 0),
  primary key (khatma_id, user_id),
  foreign key (khatma_id, user_id)
    references public.khatma_members (khatma_id, user_id) on delete cascade
);
