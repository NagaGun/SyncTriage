-- Level 2 tables: meetings, triage_results
-- Level 3 additions: pending_actions, user_tokens

create table meetings (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users,
  title       text,
  transcript  text,
  created_at  timestamptz default now()
);

create table triage_results (
  id           uuid default gen_random_uuid() primary key,
  meeting_id   uuid references meetings,
  raw_llm      jsonb,
  guardrailed  jsonb,
  created_at   timestamptz default now()
);

create table pending_actions (
  id            uuid default gen_random_uuid() primary key,
  meeting_id    uuid references meetings,
  tool_name     text,
  args          jsonb,
  status        text default 'pending',
  edited_args   jsonb,
  sent_at       timestamptz,
  reply_received boolean default false,
  created_at    timestamptz default now()
);

create table user_tokens (
  user_id       uuid references auth.users primary key,
  refresh_token text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table meetings       enable row level security;
alter table triage_results enable row level security;
alter table pending_actions enable row level security;
alter table user_tokens    enable row level security;

create policy "own meetings"        on meetings        for all using (auth.uid() = user_id);
create policy "own triage results"  on triage_results  for all using (
  meeting_id in (select id from meetings where user_id = auth.uid())
);
create policy "own pending actions" on pending_actions for all using (
  meeting_id in (select id from meetings where user_id = auth.uid())
);
create policy "own tokens"          on user_tokens     for all using (auth.uid() = user_id);
